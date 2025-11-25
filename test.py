import json

# some JSON:
json_src = '''
{

    "symbol_list": {
        "name#":"John", 
        "age":10, 
        "city#string":"New York",
        "add": [10, 20, 30]
    }

}

'''

# parse x:
game_data = json.loads(json_src)

# the result is a Python dictionary:
print(game_data["symbol_list"]["add"])


paramName = "city#string"
name, type = paramName.split("#")

switch type:
    case "string":
        print(f"{name} is string")
    case "int":
        print(f"{name} is int")
    case "float":
        print(f"{name} is float")
    case _:
        print(f"{name} is unknown type")