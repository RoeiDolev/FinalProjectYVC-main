from openai import OpenAI
import json
import os
import base64

def Extract(Path):

    client = OpenAI(api_key="key")

    print(Path)

    def load_json_schema(schema_file: str) -> dict:
        print(schema_file)
        with open(schema_file, 'r') as file:
            return json.load(file)


    # Load the JSON schema
    invoice_schema = load_json_schema('First\Backend\invoice_schema.json')

    # Open the local image file in binary mode
    with open(Path, 'rb') as image_file:
        print(image_file)
        image_base64 = base64.b64encode(image_file.read()).decode('utf-8')

    response = client.chat.completions.create(
        model='gpt-4o',
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "provide JSON file that represents this document. Use this JSON Schema: " +
                        json.dumps(invoice_schema)},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        max_tokens=500,
    )

    # Extract the JSON data from the response
    json_data = json.loads(response.choices[0].message.content)



    # Process the JSON data to return the items as a list of dictionaries with name, price, and amount
    items = [{"name": item.get("description"), "price": item.get("price"), "amount": item.get("quantity")} for item in json_data.get("items", [])]

    filename_without_extension = os.path.splitext(os.path.basename(Path))[0]
    json_filename = f"{filename_without_extension}.json"

    # Save the processed JSON data
    with open(json_filename, 'w') as file:
        json.dump(items, file, indent=4)

    print(f"JSON data saved to {json_filename}")
    print(items)
    return items
