import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from PIL import Image
import InvoiceExtract
import random
import string
from sqlalchemy import text
from datetime import datetime


app = Flask(__name__)

# Configure the database URI
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:''@localhost/easyreceipt'

# Initialize SQLAlchemy and Marshmallow for ORM and serialization
db = SQLAlchemy(app)
ma = Marshmallow(app)

# User model to store user details in the database
class User(db.Model):
    email = db.Column(db.String(100), primary_key=True)  # Primary key
    username = db.Column(db.String(30))
    password = db.Column(db.String(30))

    def __init__(self, email, username, password):
        self.email = email
        self.username = username
        self.password = password

# Marshmallow schema for serializing User objects
class userSchema(ma.Schema):
    class Meta:
        fields = ('email', 'username', 'password')

user_Schema = userSchema()
users_Schema = userSchema(many=True)

# Route to get all user data
@app.route('/get', methods=['GET'])
def get_user_data():
    users = User.query.all()
    result = users_Schema.dump(users)
    return jsonify(result)

# Route to check user credentials
@app.route('/check_user', methods=['GET'])
def check_user():
    username = request.args.get('username')
    password = request.args.get('password')

    user = User.query.filter_by(username=username).first()

    if user and username is not None:
        if user.password == password:
            return jsonify("2")  # Valid user
        else:
            return jsonify("1")  # Invalid password
    else:
        return jsonify("0")  # User not found

# Route to add a new user
@app.route('/add', methods=['POST'])
def add_Details():
    email = request.json['email']
    username = request.json['username']
    password = request.json['password']

    # Check if the email or username already exists
    existing_user_email = User.query.filter_by(email=email).first()
    existing_user_username = User.query.filter_by(username=username).first()

    if existing_user_email:
        return jsonify({'error': 'Email already exists.'}), 400
    if existing_user_username:
        return jsonify({'error': 'Username already exists.'}), 400

    # Add the new user to the database
    user = User(email, username, password)
    db.session.add(user)
    db.session.commit()

    return user_Schema.jsonify(user)

# Product model to store product details
class Products(db.Model):
    ReceiptCode = db.Column(db.String(255), nullable=False, primary_key=True)
    ProductName = db.Column(db.String(255), nullable=False)
    Price = db.Column(db.Integer, nullable=False)
    Amount = db.Column(db.Integer, nullable=False)

# Receipts model to store receipt details
class Receipts(db.Model):
    user = db.Column(db.String(50), nullable=False, primary_key=True)
    ReceiptCode = db.Column(db.String(50), nullable=False, primary_key=True)
    Date = db.Column(db.DateTime, nullable=False)

# Function to insert a product into the database
def insert_product(receipt_code, product_name, price, amount):
    existing_product = Products.query.filter_by(ReceiptCode=receipt_code, ProductName=product_name).first()
    
    if existing_product:
        print(f"Product with ReceiptCode: {receipt_code} and ProductName: {product_name} already exists.")
    else:
        new_product = Products(
            ReceiptCode=receipt_code,
            ProductName=product_name,
            Price=price,
            Amount=amount
        )
        db.session.add(new_product)
        db.session.commit()
        print(f"Product with ReceiptCode: {receipt_code} and ProductName: {product_name} added successfully.")

# Function to generate a random string suffix for receipt codes
def generate_random_suffix(length=4):
    charset = string.ascii_letters + string.digits  
    return ''.join(random.choices(charset, k=length))

# Route to upload an image and extract product details
@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image = request.files['image']
    receipt_code = request.form.get('receipt_code')  
    username = request.form.get('user') 

    try:
        # Ensure the receipt code is unique
        existing_receipt = Products.query.filter_by(ReceiptCode=receipt_code).first()
        while existing_receipt:
            suffix = generate_random_suffix() 
            receipt_code = receipt_code + suffix  
            existing_receipt = Products.query.filter_by(ReceiptCode=receipt_code).first()

        # Save the image locally
        image.save('First/Photos/image.jpg')
        print("image saved")

        # Extract items from the image using the InvoiceExtract module
        items = InvoiceExtract.Extract('First/Photos/image.jpg')

        if not items:
            return jsonify({'error': 'No items found in the image'}), 400

        # Insert each extracted item into the database
        for item in items:
            insert_product(receipt_code, item['name'], item['price'], item['amount'])

        # Add the receipt entry to the database
        receipt_entry = Receipts(
            user=username,
            ReceiptCode=receipt_code,
            Date=datetime.utcnow()
        )
        db.session.add(receipt_entry)
        db.session.commit()

        return jsonify({'message': 'Image processed and data inserted successfully', 'items': items, 'receipt_code': receipt_code})

    except FileNotFoundError as ex:
        return jsonify({'error': str(ex)}), 404
    
    except Exception as e:
        db.session.rollback() 
        return jsonify({'error': str(e)}), 500

# Route to get products by receipt code
@app.route('/get_products', methods=['GET'])
def get_products():
    try:
        receipt_code = request.args.get('receipt_code')
        print(f"Received receipt_code: {receipt_code}")
        
        results = db.session.execute(text("SELECT ProductName, Price, Amount FROM Products WHERE ReceiptCode = :receipt_code"), {'receipt_code': receipt_code}).fetchall()

        print(f"Results: {results}")

        if results:
            products_list = [
                {
                    "ProductName": row[0],  
                    "Price": row[1],        
                    "Amount": row[2]        
                } for row in results
            ]
            return jsonify(products_list)
        else:
            return jsonify({"message": "No products found for the provided receipt code"}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# Route to check if a receipt code exists
@app.route('/check_code', methods=['GET'])
def check_code():
    receipt_code = request.args.get('receipt_code')

    product = Products.query.filter_by(ReceiptCode=receipt_code).first()

    if product:
        return jsonify({'exists': True})
    else:
        return jsonify({'exists': False})

# Route to add a product manually
@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        product_name = request.json['name']
        price = request.json['price']
        amount = request.json['amount']
        receipt_code = request.json['password']  # Password used as receipt code

        insert_product(receipt_code, product_name, price, amount)

        return jsonify({'message': 'Product added successfully'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}") 
        return jsonify({'error': str(e)}), 500

# Route to get receipts based on username
@app.route('/get_receipts', methods=['GET'])
def get_receipts():
    username = request.args.get('username')
    print(f"Received username: {username}")

    if not username:
        return jsonify({'error': 'No username provided'}), 400
    
    receipts = Receipts.query.filter_by(user=username).all()
    print(f"Found receipts: {receipts}")

    if not receipts:
        return jsonify({'receipts': []}), 200

    receipts_list = [
        {'receiptCode': r.ReceiptCode, 'date': r.Date.strftime('%Y-%m-%d %H:%M:%S')}
        for r in receipts
    ]
    print(receipts_list)
    
    return jsonify({'receipts': receipts_list}), 200

# Run the Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
