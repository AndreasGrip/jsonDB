## JSON DB

This is in fact a javascript object that is available and changeable from the web using rest. It can be used to share status, config, data or hearbeat between programs/services,
Being written in vanilla javascript it's lighning fast and dont require any modules

Here are the definition of the http requests.

GET - Reciving a signle or multiple resources
POST - Create a new reseource - Never overwrites, adds to arrays create new objects/elements if they are not present before. Return error 409 (conflict) if already existing.
PUT - Create or Update a resource (overwrite unlike PATCH)
DELETE - Delete a resource.
PATCH - Update an existing objects. Return 409 (conflict) if trying to "merge" object of different types, like a number to a object.

{name: "Tux", owner:"Linux"} patched with {owner: "Linus", spicies: "Penguin"} will result in {name: "Tux", owner: "Linus", spicies: "Penguin"}

From the example server is running on 127.0.0.1, listen to port 3030 and the database/object is as follows.
{name:"Linux", type:"OS", mascot: {name:'tux', owner:"Linus", spicies:'Penguin'}, users:[{"name":"John", type:"user"}, {"name":"Jane", type:"user"}, {"name":"Linus", type:"Admin"},{"name":"Donald", type:"Duck"}]}

curl 127.0.0.1:3030  will return {"name":"Linux","type":"OS","mascot":{"name":"tux","owner":"Linus","spicies":"Penguin"},"users":[{"name":"John", type:"user"}, {"name":"Jane", type:"user"}, {"name":"Linus", type:"Admin"},{"name":"Donald", type:"Duck"}]}
curl 127.0.0.1:3030/mascot will return {"name":"tux","owner":"Linus","spicies":"Penguin"}
curl -X 'PATCH' -d '{"name": "Tux"}' 127.0.0.1:3030/mascot will not return anything visible but http code 200
curl 127.0.0.1:3030/mascot will Now return {"name":"Tux","owner":"Linus","spicies":"Penguin"}
curl -X 'POST' -d '{"name";"Google", "type": "Evil"}' 127.0.0.1:3030/users
curl 127.0.0.1:3030 will now return {"name":"Linux","type":"OS","mascot":{"name":"Tux","owner":"Linus","spicies":"Penguin"},"users":[{"name":"John", type:"user"}, {"name":"Jane", type:"user"}, {"name":"Linus", type:"Admin"},{"name":"Donald", type:"Duck"}, {"name";"Google", "type": "Evil"}]}
curl -X 'PUT' -d 'Griffin' 127.0.0.1:3030/users
curl 127.0.0.1:3030 will now return {"name":"Linux","type":"OS","mascot":{"name":"Tux","owner":"Linus","spicies":"Penguin"},"users":"Griffin"}
curl -X 'DELETE' 127.0.0.1:3030/mascot
curl 127.0.0.1:3030 will now return {"name":"Linux","type":"OS","users":"Griffin"}


Getting only selected data back
From the example server is running on 127.0.0.1, listen to port 3030 and the database/object is as follows.
{name:"Linux", type:"OS", mascot: {name:'tux', owner:"Linus", spicies:'Penguin'}, users:[{"name":"John", type:"user"}, {"name":"Jane", type:"user"}, {"name":"Linus", type:"Admin"},{"name":"Donald", type:"Duck"}]}
Basically you use the parameter (the things after ? in the url) show to select what to view. To show multiple variables use ?show=value1,value2 or ?show=value1&show=value2
For Arrays each object in the array will be handled

curl 127.0.0.1:3030?show=name will return {"name":"Linux"}
curl 127.0.0.1:3030/users?show=name will return [{"name":"John"},{"name":"Jane"},{"name":"Linus"},{"name":"Donald"}]
curl 127.0.0.1:3030?show=name,users will return {"name":"Jane","type":"user"},{"name":"Linus","type":"Admin"},{"name":"Donald","type":"Duck"}]}
curl 127.0.0.1:3030/?show=name&show=users will return {"name":"Jane","type":"user"},{"name":"Linus","type":"Admin"},{"name":"Donald","type":"Duck"}]}
