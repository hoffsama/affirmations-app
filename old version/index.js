console.log('Hello Samantha!');

const { readFile } = require('fs').promises;


async function hello() {
    
    const txt = await readFile('./hello.txt', 'utf8');
    console.log(txt);
}

hello();

const myModule = require()