const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3zjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const database = client.db('PraniGhor')
        const petCollection = database.collection('pets')
        const categoryCollection = database.collection('categories')
        const requestCollection = database.collection('requests')
        const campaignCollection = database.collection('campaigns')
        const userCollection = database.collection('users')
        // users
        app.get('/users', async (req, res) => {
            const result = userCollection.find().toArray()
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const users = req.body
            const result = await userCollection.insertOne(users)
            res.send(result)
        })
        app.get('/pets', async (req, res) => {
            const skip = parseInt(req.query.skip)
            const size = parseInt(req.query.limit)
            console.log(skip, size);
            const pets = await petCollection.find().skip(skip).limit(size).toArray()
            const petsCount = await petCollection.estimatedDocumentCount()
            const finalResult = [...pets, { petsCount: petsCount }]
            res.send(pets)
        })
        app.get('/featured-pets', async (req, res) => {
            const featured = { featuredStatus: true }
            const result = await petCollection.find(featured).sort({ interactionCount: -1 }).toArray()
            res.send(result);
        })
        app.get('/filter-pet', async (req, res) => {
            const query = req.query
            const result = await petCollection.find(query).toArray()
            console.log(query);
        })
        // category
        app.get('/pet-category', async (req, res) => {
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })
        app.post('/add-pet', async (req, res) => {
            const newPet = req.body
            const result = await petCollection.insertOne(newPet)
            res.send(result)
        })
        app.get('/my-pets', async (req, res) => {
            const query = {
                "postedBy.email": req.query.email
            }
            const result = await petCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/adoption-requests', async (req, res) => {
            const data = req.body
            const result = await requestCollection.insertOne(data)
            res.send(result)
        })
        app.get('/my-requests', async (req, res) => {
            const query = { "authorInfo.authorEmail": req.query.authorEmail }
            const result = await requestCollection.find(query).toArray()
            res.send(result)

        })
        app.get('/pet-details/:id', async (req, res) => {
            const result = await petCollection.findOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })
        // campaign
        app.post('/create-campaign', async (req, res) => {
            const campaign = req.body
            const result = await campaignCollection.insertOne(campaign)
            res.send(result)
        })
        app.get('/campaigns', async (req, res) => {
            try {
                const query = req.query.email;

                if (query !== undefined) {
                    const email = { "authorInfo.email": req.query.email };
                    const result = await campaignCollection.find(email).toArray();
                    return res.json(result);
                }

                const result = await campaignCollection.find().toArray();
                res.json(result);
            } catch (error) {
                console.error('Error in /campaigns route:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.get('/campaigns/:id', async (req, res) => {
            const campId = req.params.id
            const result = await campaignCollection.findOne({ _id: new ObjectId(campId) })
            const query = {
                "campaignCategory.value": await result.campaignCategory.value
            }
            const recommandations = await campaignCollection.find(query).limit(3).toArray()
            const filteredRecommendations = recommandations.filter(recommendation => recommendation._id.toString() !== result._id.toString());

            const response = {
                actualData: result,
                recommendedData: filteredRecommendations
            }
            res.send(response);
        })
        app.get('')
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("Running on 5000");
})



