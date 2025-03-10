import {JsonDb} from './jsonDb.js';

const fakeDB = {name: "Linux", type: "OS", mascot: {name: 'tux', owner: "Linus", spicies: 'Penguin'}, users:[{"name": "John", type:"user"}, {"name": "Jane", type:"user"}, {"name": "Linus", type:"Admin"},{"name": "Donald", type:"Duck"}]}

const jsonTqlDb = new JsonDb(fakeDB, 3030);
jsonTqlDb.start();

// Now you can point your webrowser towards for instance http://localhost:3030/ , http://localhost:3030/asd and http://localhost:3030/asd/zxc

