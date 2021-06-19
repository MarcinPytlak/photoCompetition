const Photo = require('../models/photo.model');
const requestIp = require('request-ip');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const emailValidation = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    const correctEmail = email.match(emailValidation).join('');
    const textValidation = new RegExp(/(\w|\s|\.)*/, 'g');
    const correctTitle = title.match(textValidation).join('');
    const correctAuthor = author.match(textValidation).join('');

    if(correctEmail.length < email.length || correctTitle.length < title.length || correctAuthor.length < author.length){
      alert('You use wrong characters !!');
    };

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExtenstion = fileName.split('.').slice(-1)[0];
      console.log(fileExtenstion);
      if((fileExtenstion === 'gif' || fileExtenstion === 'jpg' || fileExtenstion === 'png') && title.length <= 25 && author.length <= 50){
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    const updatePicture = () => {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
    const voterIP = requestIp.getClientIp(req);
    const getClientByIp = await Voter.findOne({ user: voterIP});
    console.log(getClientByIp);

    if(getClientByIp){
      const votesNumber = getClientByIp.votes.filter(vote => vote == req.params.id);
      if(votesNumber < 1) {
        getClientByIp.votes.push(req.params.id);
        await Voter.updateOne({ user: voterIP}, {$set: {votes: getClientByIp.votes}});
      updatePicture();
      } else {
        res.status(500).json( 'You cannot vote one more time on the same candidate!');
      }
    }
    else {
      const newVoter = await Voter({ user: voterIP, votes: req.params.id});
      await newVoter.save();
      updatePicture();
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
