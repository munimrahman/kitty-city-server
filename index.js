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
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');

        // Get All PRODUCTS Data
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const count = await cursor.count()
            const page = req.query.page;
            const size = parseInt(req.query.size);
            // console.log(page, size);
            let products;
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send({
                count,
                products
            })
        });

        // Get Single Product By ID
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.json(result);
        })
        // Find Products byKeys For Cart
        app.post('/products/byKeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } }
            const cartProducts = await productsCollection.find(query).toArray();
            res.json(cartProducts);
        })
        // Create Order API
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        })
        // Get All Orders & By Email
        app.get('/orders', async (req, res) => {
            let query = {}
            const email = req.query.email;
            if (email) {
                query = { email: email }
            }
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray()
            res.json(result)
        })

        // Find Order By _id
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            // console.log(result);
            res.json(result);
        })

        // Update Order 
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            console.log(id);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    orderStatus: updateInfo.orderStatus
                }
            }
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // Delete Order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

        // Add User Info To Database (User Created With Email & Pass)
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })


        // Get Admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        // Add User Info To Database (User Created With Google)
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        // Make Admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result);
        })

        // Post User Review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        })

        // Get All User Review
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray()
            res.json(result);
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
    console.log(`Example app listening at`, port)
})