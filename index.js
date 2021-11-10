const express = require('express')
require('dotenv').config();
const cors = require('cors');
const { MongoClient } = require("mongodb");
const ObjectId = require('mongodb').ObjectId;

const app = express()

app.use(cors())
app.use(express.json())

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luqwr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('kitty-city');
        const productsCollection = database.collection('products');

        // Get All PRODUCTS Data
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const count = await cursor.count()
            const page = req.query.page;
            const size = parseInt(req.query.size);
            // console.log(page, size);
            let users;
            if (page) {
                users = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                users = await cursor.toArray();
            }
            res.send({
                count,
                users
            })
        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Running Kitty City Server!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})