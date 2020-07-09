const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const yup = require('yup');
const {nanoid} = require('nanoid')
const monk = require('monk');
const app = express();

app.use(helmet());
app.use(morgan('short'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));
require('dotenv').config()

const db = monk(process.env.MONGO_URI)
const urls = db.get('urls');
urls.createIndex({alias:1},{unique:true});

const schema = yup.object().shape({
    alias: yup.string().trim().matches(/[\w\-]/i),
    url:yup.string().trim().url().required()
});

app.post('/url',async(req,res,next)=>{
    //TODO: Create a short url
    let {alias,url} = req.body;
    try {
        await schema.validate({
            alias,
            url,
        });
        if(!alias){
            alias = nanoid(5);
        }else{
            const existing = await urls.findOne({alias});
            if(existing){
                throw new Error('Alias in use');
            }
        }
        alias = alias.toLowerCase();
        const newurl = {
            url,
            alias,
        };
        const created = await urls.insert(newurl)
        res.json(created)
       
    } catch (error) {
        next(error);
    }
});

app.use((error,req,res,next)=>{
    if(error.status){
        res.status(error.status)
    }else{
        res.status(500);
    }
    res.json({
        message:error.message,
        stack:process.env.NODE_ENV === 'production' ? 'trace' : error.stack,
    })
});
app.get('/url/:id',(req,res)=>{
    //TODO: Get a short url by id
});

app.get('/:id',async(req,res)=>{
    //TODO: Redirect to url
    const {id:alias}=req.params;
    try {
        const url = await urls.findOne({alias})
        if(url){
            res.redirect('page.html')
        }else{
            res.redirect('error.html')
        }
    } catch (error) {
        res.redirect('error.html')
    }
});


const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Listening on the port ${port}`);
});