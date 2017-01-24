
var Botkit = require('botkit');
var os = require('os');
var pg = require('pg');

//create a config to configure both pooling behavior
//and client options
//note: all config is optional and the environment variables 
//will be read if the config is not present
var config = {
    user: '{yourusername}', //env var: PGUSER
    database: '{yourdb}', //env var: PGDATABASE
    password: '{yourpw}', //env var: PGPASSWORD
    host: '{yourhost}', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000,  // how long a client is allowed to remain idle before being closed
};



var controller = Botkit.slackbot({
    debug: false
    //include "log: false" to disable logging 
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity 
});


// connect the bot to a stream of messages 
controller.spawn({
    token: '{yourtoken}',
}).startRTM()


var aptusers = []; //Initialize empty array to store Slack User Information
queryUsername();   //Populate aptusers array


controller.hears(['who am i'], 'direct_message,direct_mention,mention', function (bot, message) {

    var userindex = aptusers.map(function (d) {
        return d['userid'];
    }).indexOf(message.user);

    var username = aptusers[userindex].username;

    bot.reply(message, 'Calm down Zoolander, I know exactly who you are. Your friends call you ' + username +
        ', but you will always be ' + message.user + ' to me.');

});


function queryUsername() {

    //this initializes a connection pool
    //it will keep idle connections open for 5 minutes
    //and set a limit of maximum 10 idle clients
    var pool = new pg.Pool(config);

    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool
    pool.connect(function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }

        //return the list of user ids and usernames
        client.query("SELECT userid, username from slack.slackuser;",
            function (err, result) {
                //call `done()` to release the client back to the pool
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                //assign the results back to the global variable, aptusers
                aptusers = result.rows;
            });

    });

    pool.on('error', function (err, client) {
        // if an error is encountered by a client while it sits idle in the pool
        // the pool itself will emit an error event with both the error and
        // the client which emitted the original error
        // this is a rare occurrence but can happen if there is a network partition
        // between your application and the database, the database restarts, etc.
        // and so you might want to handle it and at least log it out
        console.error('idle client error', err.message, err.stack)
    })
}

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function (bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
            '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });



controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function (bot, message) {

    bot.startConversation(message, function (err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function (response, convo) {
                    convo.say('Ok... See you later I guess.');
                    convo.next();
                    setTimeout(function () {
                        process.exit();
                    }, 3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function (response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
        ]);
    });
});


controller.hears(['start','hello', 'hi'], 'direct_message,direct_mention,mention', function (bot, message) {

// ACTUAL CONVERSATION

    bot.startConversation(message, function (err, convo) {

        convo.ask('Hi there, are you ready to give feedback?', [
            {
                pattern: bot.utterances.yes,
                callback: function (response, convo) {
                    convo.say('Ok... great.');
                    convo.next();
                    convo.ask('What project does the feedback pertain to?', function (response, convo) {         
                        convo.say('Got it.');
                        convo.next();
                        convo.ask('Now, who are we talkin about here?', function (response, convo) {           
                            convo.say('Cool, you want to give feedback to ' + response.text);
                            convo.next();
                            convo.ask('Is that correct?', [
                                {
                                    pattern: bot.utterances.yes,
                                    callback: function (response, convo) {
                                        convo.say('Sweet. Lets do this.');
                                        convo.next();
                                        convo.ask('Choose one of the following feedback types:\r\n    Say *1* for >\r\n    Say *2* for <\r\n    Say *3* for ++\r\n    Say *4* for +\r\n    Say *5* for -\r\n    Say *6* for --', [
                                            {
                                                pattern: '1',
                                                callback: function (response, convo) {
                                                    convo.say(':thumbsup:');
                                                    convo.next();
                                                    convo.ask('What is the feedback?', function (response, convo) {  
                                                    convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                            }
                                            },
                                            {
                                                pattern: '2',
                                                callback: function (response, convo) {
                                                    convo.say(':thumbsup:');
                                                    convo.next();
                                                    convo.ask('Ok, what should they do less of?', function (response, convo) { 
;                                                   convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                                }
                                            },
                                            {
                                                pattern: '3',
                                                callback: function (response, convo) {
                                                    convo.say(':thumbsup:');
                                                    convo.next();
                                                    convo.ask('Wow, someone did great! :clap: Tell me more about it.', function (response, convo) {
                                                    convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                                }
                                            },
                                            {
                                                pattern: '4',
                                                callback: function (response, convo) {
                                                    convo.say(':thumbsup:');
                                                    convo.next();
                                                    convo.ask('Awesome! Tell me more about what they did.', function (response, convo) {
                                                    convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                                }
                                            },
                                            {
                                                pattern: '5',
                                                callback: function (response, convo) {
                                                    convo.say(':confused:');
                                                    convo.next();
                                                    convo.ask('I see. Tell me about it', function (response, convo) {
                                                    convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                                }
                                            },
                                            {
                                                pattern: '6',
                                                callback: function (response, convo) {
                                                    convo.say(':sweat_smile:');
                                                    convo.next();
                                                    convo.ask('Ahh, I see. Well, give me some constructive criticism to pass along so we can change that.', function (response, convo) {
                                                    convo.say('Duly noted. Ill be sure to pass that along. Well, are all done here! You can say *start* to leave feedback for someone else or *end* to leave me (:slightly_frowning_face:)');
                                                    convo.next();
                                                    });
                                                }
                                            }
                                        ]);
                                    }
                                },
                                {
                                    pattern: bot.utterances.no,
                                    callback: function (response, convo) {
                                        convo.say('Ok, respond with *start* to try again'); // this should become a thread
                                        convo.next();
                                    }
                                }
                            ]);

                        });

                        convo.next();
                    }); //remove
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function (response, convo) {
                    convo.say('Ok, sorry.. I can only collect feedback right now, but stay tuned for more features!');
                    convo.next();
                }
            }
        ]);
        });
});

// UPTIME AND INTRODUCTION

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function (bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
            '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });


// SHUT DOWN

controller.hears(['exit'], 'direct_message,direct_mention,mention', function (bot, message) {

    bot.startConversation(message, function (err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function (response, convo) {
                    convo.say('Ok... See you later I guess.');
                    convo.next();
                    setTimeout(function () {
                        process.exit();
                    }, 3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function (response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
        ]);
    });
});


// CALCULATE UPTIME

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

