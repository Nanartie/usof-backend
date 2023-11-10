const nodemailer = require('nodemailer');

class SendMail {
    constructor(userEmail) {
        this.from = 'email@gmail.com';
        this.password = 'password ';
    }
    async send(to, token, type) {
        const massageEmail = {};
        if (type === 'activate') {
            massageEmail.subject = 'Email confirmation for registr usof';
            massageEmail.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Mail</title>
                    <style>
                        
                    </style>
                </head>
                <body>
                    <div>
                        <h1 class="header">usof confirm</h1>
                        <div class="text-div" style="justify-content: center">
                            <p class="text">
                                Thank you for registering on our usof website project,
                                <a style="color:#fba92c;"class ="confirm-link" href="http://localhost:3000/active/${token}">
                                    click here
                                </a>
                                to confirm your email.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `;
        } else {
            massageEmail.subject = 'Reset password for usof';
            massageEmail.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Mail</title>
                    <style>
                       
                    </style>
                </head>
                <body>
                    <div>
                        <h1 class="header">Usof reset</h1>
                        <div class="text-div" style="justify-content: center">
                            <p class="text">
                                You requested for reset password on usof website project,
                                <a style="color:#fba92c;"class ="confirm-link" href="http://localhost:3000/password-reset/${token}">
                                    click here
                                </a>
                                to reset your password.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `;
        }
        const mail = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: this.from,
                pass: this.password,
            },
        });
        
        const mailOptions = {
            from: this.from,
            to,
            subject: massageEmail.subject,
            text: '',
            html: massageEmail.html,
        };
        
        try {
            await mail.sendMail(mailOptions);
            console.log('send massage');
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new SendMail();
