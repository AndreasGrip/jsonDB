import {JsonDb} from './jsonDb.js';

const fakeDB = {name: "Linux", type: "OS", mascot: {name: 'tux', owner: "Linus", spicies: 'Penguin'}, users:[]}

const jsonTqlDb = new JsonDb(fakeDB, 3030);
jsonTqlDb.start();

// Now you can point your webrowser towards for instance http://localhost:3030/ , http://localhost:3030/asd and http://localhost:3030/asd/zxc

