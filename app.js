var express = require('express')
var app = express()
var nocache = require('nocache')
app.use(nocache())
const nodemailer = require('nodemailer')
app.get('/', (req, res) => res.send('Hello World!'))
var bodyParser = require('body-parser')
app.use(bodyParser.json());

var PxlMongodb = require('pxl-mongodb');


var pxl = new PxlMongodb({

    collectionPxls: 'pxls', // Name of the collection to store pxl documents for access tracking
    collectionLinks: 'links', // Name of the collection to store shortened links

    alwaysShortenWithNewLinkId: false // Set to true if you need a different linkId each time you shorten a link - even if the link was shortened before

})



/** 
 * Returns HTML with Open/Click Trackers
 *  
 * @param {*} pxl  
 * @param {*} req The Request containing the original HTML  
 * @param {*} res  The Response containing the HTML with trackers
 */
function initMailTracking(pxl, req, res) {

    pxl.connect('mongodb://localhost:27017/mailtrack', {}) // Passed values are the defaults
        .then((collections) => {



            let PxlForEmails = require('pxl-for-emails')

            let pxlForEmails = new PxlForEmails({
                pxl,
                getFullShortenedLink(linkId) {
                    return `http://localhost:3000/shortly/${linkId}`
                }
            })


            var Html = req.body.content;

            var addTrackingToHtml = pxlForEmails.addTracking(Html, { recipient: 'abdelmlak.dhif@esprit.tn' }).then((htmlF) => {


                // Sending the response
                res.send(htmlF);

                // Disconnecting
                pxl.disconnect()
                    .then(() => {
                        console.log('Database connection is closed')
                    })


            })


        }).catch((err) => {
            console.log(err);
        })


}


/**
 * @param {*} Route The tracking route 
 * @param {*} pxl.trackPxl Logs the tracked mail in the database
 * @param {*} pxl.redirect Redirects to the original url
 */
app.get('/shortly/:linkId/:pixelId', pxl.trackPxl, pxl.redirect)


app.post('/html', (req, res) => {
    initMailTracking(pxl, req, res);

})


app.listen(3000, () => console.log('Example app listening on port 3000!'))