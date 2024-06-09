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
        const donationCollection = database.collection('donations')
        //donations
        app.post('/donations', async (req, res) => {
            const data = req.body
            const result = await donationCollection.insertOne(data)
            res.send(result)
        })
        // app.get('/donations', async (req, res) => {
        //     const query = req.query.email
        //     if(query){
        //         const result = await donationCollection.find({})
        //     }
        // })
        // users
        app.patch('/make-admin', async (req, res) => {
            const id = req.body.id
            const query = { _id: new ObjectId(id) }
            const cursor = {
                $set: {
                    role: "admin"
                }
            }
            const result = userCollection.updateOne(query, cursor, { upsert: true })
            res.send(result)
        })
        app.patch('/remove-admin', async (req, res) => {
            const id = req.body.id
            const query = { _id: new ObjectId(id) }
            const cursor = {
                $set: {
                    role: "user"
                }
            }
            const result = userCollection.updateOne(query, cursor, { upsert: true })
            res.send(result)
        })
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray()
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
            const pets = await petCollection.find({ status: { $ne: 'Adopted' } }).skip(skip).limit(size).toArray()
            const petsCount = await petCollection.estimatedDocumentCount()
            const finalResult = [...pets, { petsCount: petsCount }]
            res.send(pets)
        })
        app.get('/pet-data', async (req, res) => {
            const id = req.query.id
            const petData = await petCollection.findOne({ _id: new ObjectId(id) })
            res.send(petData)
        })
        app.patch('/edit-pet', async (req, res) => {
            const id = req.query?.id
            const query = { _id: new ObjectId(id) }
            const body = req.body
            const cursor = {
                $set: {
                    name: body.name,
                    age: body.age,
                    category: body.category,
                    categoryId: body.categoryId,
                    image: body.image,
                    location: body.location,
                    shortDescription: body.shortDescription,
                    longDescription: body.longDescription,
                    adoptionUrgency: body.adoptionUrgency,
                    vaccinated: body.vaccinated,
                    neutered: body.neutered,
                }
            }
            const result = await petCollection.updateOne(query, cursor, { upsert: true })
            res.send(result);
        })
        app.delete('/delete-pet', async (req, res) => {
            const id = req.query.id
            const result = await petCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
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
            if (query) {
                const result = await petCollection.find(query).toArray()
            }
            const result = await petCollection.find().toArray()

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

                const result = await campaignCollection.find({ status: { $ne: "paused" } }).toArray();
                res.json(result);
            } catch (error) {
                console.error('Error in /campaigns route:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        app.get('/my-donation', async (req, res) => {
            const query = { 'authorInfo.email': req.query.email }
            if(query){
                const result = await campaignCollection.find(query).toArray()
            }
            const result = await campaignCollection.find().toArray()
            res.send(result)
        })
        app.get('/edit-campaign/:id', async (req, res) => {
            const campaign = await campaignCollection.findOne({ _id: new ObjectId(req.params.id) })
            res.send(campaign)
        })
        app.patch('/edit-campaign', async (req, res) => {
            const query = { _id: new ObjectId(req.query.id) }
            const data = req.body
            const option = {
                $set: {
                    campaignName: data.campaignName,
                    campaignImage: data.campaignImage,
                    campDeadline: data.campDeadline,
                    maxDonation: data.maxDonation,
                    campaignCategory: data.campaignCategory,
                    shortDescription: data.shortDescription,
                    longDescription: data.longDescription,
                }
            }
            console.log(option);
            const campaign = await campaignCollection.updateOne(query, option, { upsert: true })
            res.send(campaign)
        })
        app.patch('/pet-status', async (req, res) => {
            const id = req.query.id
            const option = {
                $set: {
                    "status": 'Adopted'
                }
            }
            const petUpdate = await petCollection.updateOne({ _id: new ObjectId(id) }, option, { upsert: true })
            res.send(petUpdate)
        })
        app.get('/pet-requests', async (req, res) => {
            const id = req.query.id
            const petId = req.query.petId
            // change the status
            const query = { "postInfo.petId": petId }
            const option1 = {
                $set: {
                    "postInfo.status": 'adopted'
                }
            }
            const option2 = {
                $set: {
                    "status": 'Adopted'
                }
            }
            const statusUpdate = await requestCollection.updateOne({ _id: new ObjectId(id) }, option1, { upsert: true })
            const deleteQuery = await requestCollection.find(query).toArray()
            const deletionIds = deleteQuery
                .filter(doc => doc.postInfo?.status !== "adopted")
                .map(doc => doc._id);
            const deleteResult = await requestCollection.deleteMany({ _id: { $in: deletionIds.map(id => new ObjectId(id)) } })
            const petUpdate = await petCollection.updateOne({ _id: new ObjectId(petId) }, option2, { upsert: true })
            res.send(petUpdate)
        })
        app.delete('/delete-request', async (req, res) => {
            const query = { _id: new ObjectId(req.query.id) }
            const result = await requestCollection.deleteOne(query)
            res.send(result)
        })
        app.patch('/pause-campaign', async (req, res) => {
            const query = { _id: new ObjectId(req.query.id) }
            const status = req.query.newStatus;
            const option = {
                $set: {
                    status: status
                }
            }
            const campaign = await campaignCollection.updateOne(query, option, { upsert: true })
            res.send(campaign)
        })
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
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("Running on 5000");
})



