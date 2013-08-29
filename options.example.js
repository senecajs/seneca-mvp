

module.exports = {

  main: {
    port:3333,
    public:'/public'
  },

  auth: {
    // change to true if you want to send emails
    sendemail:false
  },

  mail: {
    mail: {from:'youremail@example.com'},
    config:{
      service: "Gmail",
      auth: {
        user: "youremail@example.com",
        pass: "yourpass"
      }
    }
  }
}
