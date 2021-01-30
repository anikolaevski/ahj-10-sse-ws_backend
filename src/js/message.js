class Message {
  constructor(obj) {
    this.id = (obj.id) ? obj.id : Math.random().toString(16).slice(2);
    this.created = (obj.created) ? obj.created : new Date();
    this.user = obj.user;
    this.typ = obj.typ;
    this.text = obj.text;
  }

  short() {
    return {
      id: this.id,
      created: this.created,
      user: this.user,
      typ: this.typ,
    };
  }
}

module.exports = {
  Message,
};
