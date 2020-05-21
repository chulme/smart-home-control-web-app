const nodemailer = require("nodemailer");
const ejs = require("ejs");
const htmlToText = require('nodemailer-html-to-text').htmlToText;

module.exports = function Mail(mailTemplate, mailTo, mailSubject, mailContext, mailAttachments) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: "f0e5d04db6c127", // generated ethereal user
          pass: "34e67ec8ff0057" // generated ethereal password
        },
        tls: {
          rejectUnauthorized:false
        }
    });

    transporter.use('compile', htmlToText());

    ejs.renderFile(__dirname + `/views/emails/${mailTemplate}.ejs`, mailContext, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            let attachments = [{
                    filename: 'image.png',
                    path: __dirname+'/public/images/Eco-Watt-Logo-05.png',
                    cid: 'ecowattlogo' //same cid value as in the html img src
            }];

            mailAttachments = mailAttachments ? mailAttachments : [];
            mailAttachments.forEach(function(mailAttachment){
                attachments.push({
                    filename: mailAttachment.filename,
                    path: __dirname+'/'+mailAttachment.path,
                    cid: mailAttachment.cid
                });
            });
            transporter.sendMail({
                from: '"Eco Watt" <info@eco-watt.tech>', // sender address
                to: mailTo, // list of receivers
                subject: mailSubject, // Subject line
                html: data, // html body
                attachments: attachments
            }, function(error, info) {
                if (error) {
                    console.log(error);
                }
                console.log("Message sent: %s", info.messageId);
            });
        }
    });
};