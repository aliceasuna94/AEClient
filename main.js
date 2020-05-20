const arweave = Arweave.init({host:"arweave.net",port:443,logging:!0,protocol:"https",timeout: 80000,});
let jsonfromtrx = [];
let sortArray =[];

//login
function openNextwallet() {
        const input = document.getElementById('next-wallet');
        if (input) {
            input.addEventListener('change', function () {
                const reader = new FileReader();
                reader.addEventListener('load', function(e) {
                    jwk = e.target.result;
                });
                reader.onload = function() {

                    try {
                      jwk = JSON.parse(jwk);
                      arweave.wallets.jwkToAddress(jwk).then((address) => {
                          wallet_address = address;
                          arweave.wallets.getBalance(wallet_address).then((balance) => {
                              try {
                                  sessionStorage.setItem("wallet", wallet_address);
                                  sessionStorage.setItem("key", JSON.stringify(jwk));
                                  wallet = JSON.parse(sessionStorage.getItem("key"));
                                  myAddress = sessionStorage.getItem("wallet");
                                  let winston = balance;
                                  var bl = arweave.ar.winstonToAr(balance);
                                  sessionStorage.setItem("balance", bl);
                                    (async () => {
                                        var arweaveID = await get_name(wallet_address);
                                        sessionStorage.setItem("arweaveID", arweaveID);
                                    });

                                  window.location.search =  window.location.search;

                              } catch(err) {

                              }

                          });
                      });
                    } catch (e) {
                        $.alert({
                          title: 'Error!',
                          content: 'Please check your JSON keyfile!',
                          icon: 'fa fa-warning',
                          type: 'red',
                          closeIcon: true,
                          boxWidth: '300px',
                          useBootstrap: false,
                        });
                    }

                }
                reader.readAsText(input.files[0]);

            }, false);
        }
}

function goto () {
                $("#next-wallet").click();
                openNextwallet();
}

function logout(){
    sessionStorage.removeItem("key");
    location.reload();
}

//Session login
var seskey = JSON.parse(sessionStorage.getItem("key"));
let myBalance = sessionStorage.getItem("balance");
var wallet = JSON.parse(sessionStorage.getItem("key"));
var myAddress = sessionStorage.getItem("wallet");
var arweaveID = sessionStorage.getItem("arweaveID");




if (seskey==null) {
      $(document).ready(function() {
      $("#login").css('display','block');
      $("#wrapper").css('display','none');
    });
}else {
    myBalance =sessionStorage.getItem("balance");
    wallet = JSON.parse(sessionStorage.getItem("key"));
    myAddress = sessionStorage.getItem("wallet");
    getInboxList();
    getContact();
      $(document).ready(function() {
        $("#wrapper").css('display','block');
        $("#login").css('display','none');
        document.getElementById("inbox").style.display = "none";
        document.getElementById("inbox-title").style.display = "none";

        closeNav();
      });

}


//Open Navigation
function openNav() {
  document.getElementById("sidebar").style.width = "200px";
}

//Close Navigation
function closeNav() {
  const btn = document.querySelector('.sidebar');
  const display = btn.style.width;

  if (display == "200px") {
      document.getElementById("sidebar").style.width = "0";
  }

}

//Check Address length
function AddLength(element, index, array) {
    return element.length == 43;
}

function ifSameAddress(element, index, array) {
    return element !== myAddress;
}

//Check balance
async function checkBalance(){
    var balance = "1";
    return balance;
}

//Encrypt Email Data
async function encrypt_mail (content, subject, pub_key) {
    var content_encoder = new TextEncoder()
    var newFormat = JSON.stringify({ 'subject': subject, 'body': content })
    var mail_buf = content_encoder.encode(newFormat)
    var key_buf = await generate_random_bytes(256)

    // Encrypt data segments
    var encrypted_mail =
		await arweave.crypto.encrypt(mail_buf, key_buf)
    var encrypted_key =
		await window.crypto.subtle.encrypt(
		    {
		        name: 'RSA-OAEP'
		    },
		    pub_key,
		    key_buf
		)

    // Concatenate and return them
    return arweave.utils.concatBuffers([encrypted_key, encrypted_mail])
}

//Get public key from address
async function get_public_key (address) {
    var txid = await arweave.wallets.getLastTransactionID(address)

    if (txid == '') {
        return undefined
    }

    var tx = await arweave.transactions.get(txid)

    if (tx == undefined) {
        return undefined
    }

    var pub_key = arweave.utils.b64UrlToBuffer(tx.owner)

    var keyData = {
        kty: 'RSA',
        e: 'AQAB',
        n: tx.owner,
        alg: 'RSA-OAEP-256',
        ext: true
    }

    var algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }

    return await crypto.subtle.importKey('jwk', keyData, algo, false, ['encrypt'])
}

//Generate random bytes to Encrypt
async function generate_random_bytes (length) {
    var array = new Uint8Array(length)
    window.crypto.getRandomValues(array)

    return array
}

//Decrypt Mail from Subject and Body
async function decrypt_mail (enc_data, key) {
    var enc_key = new Uint8Array(enc_data.slice(0, 512))
    var enc_mail = new Uint8Array(enc_data.slice(512))

    var symmetric_key = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, enc_key)

    return arweave.crypto.decrypt(enc_mail, symmetric_key)
}

//Create key from wallet
async function wallet_to_key (wallet) {
    var w = Object.create(wallet)
    w.alg = 'RSA-OAEP-256'
    w.ext = true

    var algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }

    return await crypto.subtle.importKey('jwk', w, algo, false, ['decrypt'])
}

//

async function getTrx(){
  var address = await arweave.wallets.jwkToAddress(wallet);
  const transaction = await arweave.arql({
        op: "and",
        expr1: {
          op: "equals",
            expr1: "to",
            expr2: address
        },
        expr2: {
            op:"equals",
            expr1:"App-Name",
            expr2: "permamail"

        }
  })
  return transaction;
}

//Show Inbox after Window loaded
async function getInboxList(lup){

      $('#aaa').find('.loader-a').show();
      $('#showmore').hide();

    try {
        let transaction = [];
        if (lup === "showmore") {
            let tion = JSON.parse(sessionStorage.getItem("inboxarray"));
            let nation = tion.slice(5);

            sessionStorage.removeItem("inboxarray");
            sessionStorage.setItem("inboxarray", JSON.stringify(nation));
            transaction = JSON.parse(sessionStorage.getItem("inboxarray"));

        }else {
            transaction = await getTrx();
            sessionStorage.removeItem("inboxarray");
            sessionStorage.setItem("inboxarray", JSON.stringify(transaction));
        }

        transaction.splice(5, transaction.length);

        var count = transaction.length;
        if (count === 0) {
          $(document).ready(function() {
              $('#aaa').find('.loader-a').hide();

              document.getElementById("inbox").style.display = "block";
              document.getElementById("inbox-title").style.display = "block";
              closeNav();
          });
          getUrlMailTo();
        }else{
        transaction.forEach(async function(item, index){
              const transaction = arweave.transactions.get(item).then(transaction => {
              let arr = [];
              transaction.get('tags').forEach(tag => {
              let value = tag.get('value', {decode: true, string: true});
              let key = tag.get('name', {decode: true, string: true});
              arr.push(value);

            });
                var a = arr[0];
                var b = arr[1];
                var c = arr[2];

                (async () => {
                  var key = await wallet_to_key(wallet)

                  var dat = transaction.data

                  try {
                      var mail = arweave.utils.bufferToString(await decrypt_mail(arweave.utils.b64UrlToBuffer(transaction.data), key))
                      var mailjson = typeof JSON.parse(mail)
                      mailjson = "object";
                  } catch (e) {
                      mail = "";
                      mailjson = "string";
                  }

                  if (mail !== "") {
                      if (mailjson == 'object') {
                          var json = JSON.parse(mail)

                          if (typeof json["subject"] === 'string' || typeof json["body"] === 'string') {
                              var sender = await arweave.wallets.ownerToAddress(transaction.owner)
                              var ar = transaction.quantity;
                              if (ar != 0) {
                                   ar = arweave.ar.winstonToAr(ar);
                              }else{
                                   ar = "0";
                              }

                              var feecheck = transaction.reward;
                              let fee = arweave.ar.winstonToAr(feecheck);
                              var nameid = await get_name(sender);

                              var subject = json["subject"]
                              var body = json["body"].replace(/\n/g, "")
                              var bodyfull = json["body"]
                              var tc = timeConverter(c)
                              var time = tc.substr(0,9)
                              var iconname = sender.substr(0,2).toUpperCase()
                              var color = iconname.toColor()
                              var transfer = subject+'arweavexaxaxa'+bodyfull+'arweavexaxaxa'+sender+'arweavexaxaxa'+tc+'arweavexaxaxa'+ar+'arweavexaxaxa'+nameid+'arweavexaxaxa'+arweaveID+'arweavexaxaxa'+color+'arweavexaxaxa'+item+'arweavexaxaxa'+iconname;
                              var en = window.btoa(transfer);
                              var jsonformat = '{"subject":"'+subject+'", "body":"'+ htmlEntities(body)+'", "en":"'+en+'", "from":"'+sender+'", "color":"'+color+'", "iconname":"'+iconname+'", "time":"'+time+'", "ar":"'+ar+'", "fee":"'+fee+'", "timesort":"'+c+'", "nameid":"'+nameid+'"}';
                              var obj = JSON.parse(jsonformat);
                              jsonfromtrx.push(obj);
                              count -= 1;

                          }else{
                            count -= 1;

                          }
                      }else{
                        count -= 1;

                      }
                  }else{
                    count -= 1;

                  }

                  if (count === 0) {
                  sortArray = jsonfromtrx.sort(dynamicSort("-timesort"));
                  inboxShow();



                  }

                })()

              }).catch(function() {
                  count -= 1;
              });

        });
      }

    } catch (e) {
        $.confirm({
            title: 'Failed get data!',
            content: 'Failed to get data, Please Reload ?',
            boxWidth: '300px',
            type: 'red',
            useBootstrap: false,
            buttons: {
                confirm: function () {
                    window.location.href = window.location.href;
                },
                cancel: function () {
                    logout();
                },

            }
        });
    }

}

//Show List Inbox with search
function inboxShow(){
    document.getElementById("inbox").style.display = "block";
    document.getElementById("inbox-title").style.display = "block";
    closeNav();
    var keyword = document.getElementById("search-input").value;
    document.getElementById("inbox").innerHTML = "";
    keyword.trim();
    if (keyword === "") {
        var mycount = sortArray.length;
        sortArray.forEach(function(item, value){

            $('#inbox').append('<div class="main-a" onclick="showMail(this.id)" id="'+item.en+'"><div class="ma-1"><div class="circle" style="background:'+item.color+';">'+item.iconname+'</div></div><div class="ma-2 wrap">'+item.nameid+'</div><div class="ma-4">'+item.time+'</div><div class="ma-3 wrap" >'+item.subject+'</div><div class="ma-3-span wrap">'+ item.body+'</div></div>');

            $('#aaa').find('.loader-a').hide();
            $('#showmore').show();

            mycount -= 1;
            if (mycount === 0) {
                getUrlMailTo();

            }

        });
    }else {
        let keyresult = [];
        sortArray.forEach(function(item, value){
            if (item.from == keyword || item.nameid == keyword) {
              $('#inbox').append('<div class="main-a" onclick="showMail(this.id)" id="'+item.en+'"><div class="ma-1"><div class="circle" style="background:'+item.color+';">'+item.iconname+'</div></div><div class="ma-2 wrap">'+item.nameid+'</div><div class="ma-4">'+item.time+'</div><div class="ma-3 wrap" >'+item.subject+'</div><div class="ma-3-span wrap">'+ item.body+'</div></div>');
              $('#aaa').find('.loader-a').hide();
              $('#showmore').show();
            }
        });


    }

}

//

function getUrlMailTo() {
  //Direct send from link
  const getURL = window.location.search;
  getURL.trim();
  if (getURL.slice(0,4) === "?to=") {

      var ccc = getURL.substr(4);
        $.confirm({
            title: 'Confirm!',
            boxWidth: '300px',
            useBootstrap: false,
            type: 'red',
            content: '<div style="word-break: break-all;">Send mail to : '+ccc+' ?</div>',
            buttons: {
                confirm: function () {
                    replyMail(ccc, "contact");
                },
                cancel: function () {

                }
            }
          });

  }
}
//Get Simple Name from Address
async function get_name(addr) {

  try {
    var add = addr;
    const transaction = await arweave.arql({
          op: "and",
          expr1: {
            op: "equals",
              expr1: "App-Name",
              expr2: "arweave-id"
          },
          expr2: {
              op:"and",
              expr1:{
                  op: "equals",
                  expr1: "from",
                  expr2: addr
              },
              expr2:{
                op: "equals",
                expr1: "Type",
                expr2: "name"
              }

          }
    })
    if (transaction.length != 0) {
        const tx = await arweave.transactions.get((transaction[0]));
        return tx.get('data', {decode: true, string: true});
    }else {
        return add;
    }
  } catch (e) {
      return add;
  }

}

//Convert UNIX_timestamp to Date
function timeConverter (UNIX_timestamp) {
      var a = new Date(UNIX_timestamp * 1000)
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      var year = a.getFullYear().toString().substr(-2)
      var month = months[a.getMonth()]
      var date = a.getDate()
      var hour = a.getHours()
      var min = a.getMinutes()
      var sec = a.getSeconds()
      var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec
      return time
}

//Get Random Color for icon
String.prototype.toColor = function() {
	var colors = ["#e51c23", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#5677fc", "#03a9f4", "#00bcd4", "#009688", "#259b24", "#8bc34a", "#afb42b", "#ff9800", "#ff5722", "#795548", "#607d8b"]

    var hash = 0;
	if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    hash = ((hash % colors.length) + colors.length) % colors.length;
    return colors[hash];
}

//Delete HTML View
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

//Show mail from inbox
function showMail(en){
  document.getElementById('tab-email-content').style.display = "block";
  document.getElementById('no-mail-selected').style.display = "none";
  document.getElementById('tab-email').style.display = "block";
  var a = en;
  var b = window.atob(a);
  var c = b.split("arweavexaxaxa");

  var sb = c[0];
  var bd = c[1];
  var sd = c[2];
  var tm = c[3];
  var ar = c[4];
  var id = c[5];
  var nm = c[6];
  var cl = c[7];
  var tx = c[8];
  var ic = c[9];

  document.getElementById('tx-trx').innerHTML = tx;
  document.getElementById('tx-trx').href = "https://viewblock.io/arweave/tx/"+tx;
  document.getElementById('tx-sb').innerHTML = sb;
  document.getElementById('tx-ic').innerHTML = ic;
  document.getElementById('tx-ic').style.background = cl;
  document.getElementById('tx-fr').innerHTML = id;
  document.getElementById('tx-fr').href = 'https://viewblock.io/arweave/address/'+sd;
  document.getElementById('tx-bd').innerHTML = bd;
  document.getElementById('tx-dt').innerHTML = tm;
  document.getElementById('tx-ar').innerHTML = ar;
  document.getElementById('rep').value = sd+'xoxox'+sb;


}

//Sort inbox function
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

var contact = "";
var contactItem = "";
//Get Contact
async function getContact() {
   const contx = await arweave.arql({
        op: "and",
        expr1: {
          op: "equals",
            expr1: "from",
            expr2: myAddress
        },
        expr2: {
            op:"equals",
            expr1:"aeclient-type",
            expr2: "contact"

        }
  })
  contact = contx;
  if (contact.length === 0) {

  }else {

      contact.forEach( async function(item){
          arweave.transactions.getData(item, {decode: true, string: true}).then(data => {
				  contactItem += '<tr><td class="aaa">'+data.toString()+'</td><td class="bbb"><input type="checkbox" value="'+data.toString()+'" name="type"></td></tr>';
				});

      });
  }
}

//Show Contact
var showConData = "";
var addnext = '<form action=""><div class="newcon"><input type="text" id="newcon-address" placeholder="Wallet Address" required></div></form>';

function showContact(){
  closeNav();
    if (contact.length === 0) {
        showConData = 'No Data';

    }else {
        showConData = '<table id="table-contact" style="width: 100%;"><tbody>'+contactItem+'</tbody></table>';
        //showConData = ''
    }

        $.confirm({
        title: 'Contact!',
        content: showConData,
        theme:'contact',
        buttons: {
            close: function () {

            },
            send: {
              text:'Send',
              btnClass:'btn-green',
              action:function(){
                var arrx = [];
                $("input:checkbox[name=type]:checked").each(function(){
                      arrx.push($(this).val());
                  });
                  if (arrx.length !== 0) {
                      sendAddtoCompose(arrx);
                  }else{
                    $.alert({
                      title: 'Error!',
                      content: 'Must select one to Send Mail',
                      type: 'red',
                      icon: 'fa fa-warning',
                      closeIcon: true,
                      boxWidth: '300px',
                      useBootstrap: false,
                    });
                  }
              }

            },
            add: {
                text: 'Add New Contact',
                btnClass: 'btn-blue',
                action: function(){
                      $.confirm({
                      title: 'Add New Contact',
                      content: addnext,
                      boxWidth: '300px',
                      type: 'red',
                      useBootstrap: false,
                      buttons: {
                          cancel: function () {

                          },
                          add: {
                              text: 'Confirm',
                              btnClass: 'btn-green',
                              action: function(){
                                  var wallet = this.$content.find('#newcon-address').val();
                                  wallet.trim();
                                  if(!wallet || wallet.length !== 43){

                                      $.alert({
                                        title: 'Error!',
                                        content: 'Please fill form or check wallet address !',
                                        type: 'red',
                                        icon: 'fa fa-warning',
                                        closeIcon: true,
                                        boxWidth: '300px',
                                        useBootstrap: false,
                                      });
                                      return false;
                                  }else {
                                    addContactAddress(wallet);

                                  }

                              }

                          }

                      }
                  });

                }

            }

        },
        onContentReady: function () {
        var jc = this;
        this.$content.find('form').on('submit', function (e) {
            e.preventDefault();
            jc.$$add.trigger('click');
        });

        this.$content.find('table').on('submit', function(e){
          e.preventDefault();
          jc.$$send.trigger('click');
        });
    }

    });
}

async function addContactAddress(a){
  $(document).ready(function() {
      $("#full-loading").addClass("display");
      $("#full-loading").removeClass("hidden");
  });

    var ab = a;

    //Check feecheck
    var size = new Blob([ab]).size;
    let checking = await fetch('https://arweave.net/price/'+size+'/'+myAddress);
    let result = await checking.text();
    let wiston = (result / 1000000000000);

    if (myBalance < wiston) {
      $.alert({
        title: 'Error!',
        content: 'The balance is not sufficient !',
        icon: 'fa fa-warning',
        type: 'red',
        closeIcon: true,
        boxWidth: '300px',
        useBootstrap: false,
      });
      $(document).ready(function() {
          $("#full-loading").removeClass("display");
          $("#full-loading").addClass("hidden");
      });
    }else{
      try {

          let transaction = await arweave.createTransaction({
          data: ab
        }, wallet);

          transaction.addTag('aeclient-type', 'contact');

          await arweave.transactions.sign(transaction, wallet);
          const response = await arweave.transactions.post(transaction);

          $.alert({
            title: 'Success!',
            content: 'Success! Please wait a few minutes.',
            closeIcon: true,
            type: 'green',
            boxWidth: '300px',
            useBootstrap: false,
          });

      } catch (e) {
        $.alert({
          title: 'Error!',
          content: 'Failed to add contact, Please try again.' ,
          icon: 'fa fa-warning',
          closeIcon: true,
          type: 'red',
          boxWidth: '300px',
          useBootstrap: false,
        });
      } finally{
        $(document).ready(function() {
            $("#full-loading").removeClass("display");
            $("#full-loading").addClass("hidden");
        });
      }
    }
}

//passToCompose

function sendAddtoCompose(a){

    var aa = a;
    var bb = "";
    aa.forEach(function(item){
      bb += item+',';
    });

      var fon = bb.slice(0, -1);

      replyMail(fon, "contact");
}

//reply
function replyMail(addrfrom, from){
      closeNav();
      var addrfrom = addrfrom;
      var from = from;
      var sub = "";
      var forx = "";

      if (from === "reply") {
          var mk = addrfrom.split("xoxox");
        
          forx = ' value="'+mk[0]+'"';
          sub = ' value="RE: '+mk[1]+'"';
      }else if (from === "contact") {
          forx = ' value="'+addrfrom+'"';
          sub = '';
      }else {
          forx = '';
          sub = '';
      }

      $.confirm({
      title: 'Prompt!',
      content: '<div class="mmm" id="mmm"><h1 style="float:left">Compose</h1><div class="loader" hidden></div><br/><br/><p>Send new message</p></div>'+
      '<div class="comps"><input type="text" id="send-subject" placeholder="Subject" '+sub+'><input type="text" id="send-target" '+forx+' placeholder="To: address1, address2">'+
      '<input type="text" id="send-ar" placeholder="AR Amount"><textarea class="textarea" id="send-content" placeholder="Mail body"></textarea>'+
      '</div>',
      theme:'compose',
      buttons: {
          formSubmit: {
              text: 'Send',
              btnClass: 'btn-blue',
              action: function () {
                  var subject = this.$content.find('#send-subject').val();
                  var target = this.$content.find('#send-target').val();
                  var ar = this.$content.find('#send-ar').val();
                  var content = this.$content.find('#send-content').val();


                  var a = target.replace(/\s+/g, "");
                  var b = subject.trim();
                  var c = ar.trim();
                  var d = content.trim();
                  var o = Math.round(new Date().getTime() / 1e3);

                  if (a != "" && b != "" && c != "" && d != "") {
                      let aa = a.split(',');
                      var aaa = aa.every(AddLength);
                      var hhh = aa.every(ifSameAddress);
                      var aal = aa.length;
                      var artotal = aal*c;
                      var size =  new Blob([d]).size;

                      if (aaa == true && hhh == true) {
                          var regex = /^\d+(?:\.\d+)?$/;
                          var filter = regex.test(c);
                          if (!filter) {
                              $.alert({
                                title: 'Error!',
                                content: 'Please input valid AR ammount. example: 0.1',
                                icon: 'fa fa-warning',
                                type: 'red',
                                closeIcon: true,
                                boxWidth: '300px',
                                useBootstrap: false,
                              });
                          }else {
                              this.$content.find('.loader').show();
                              let farray = [];
                              var total = 0;
                              var itemsProcessed = aal;
                                  aa.forEach(async function(item){
                                      var i = await get_public_key(item);
                                      if (i != null) {
                                          d = await encrypt_mail(d, b, i);
                                          var dd = d;
                                          size = new Blob([dd]).size;
                                          let checking = await fetch('https://arweave.net/price/'+size+'/'+item);
                                          let result = await checking.text();
                                          let wiston = (result / 1000000000000);
                                          farray.push(wiston);
                                          for(i = 0; i <farray.length; i++){
                                                 total += farray[i];
                                          }
                                          itemsProcessed -= 1;
                                          if (itemsProcessed === 0) {
                                              var alltotal = Number(total)+Number(artotal);
                                              if (myBalance < alltotal ) {
                                                  $.alert({
                                                    title: 'Error!',
                                                    content: 'The balance is not sufficient !',
                                                    icon: 'fa fa-warning',
                                                    type: 'red',
                                                    closeIcon: true,
                                                    boxWidth: '300px',
                                                    useBootstrap: false,
                                                  });
                                                  $('#mmm').find('.loader').hide();
                                              }else{

                                                  var itemAddr = aa.toString();
                                                  $.confirm({
                                                      title: 'Confirm!',
                                                      content: 'Fee + Quantity: '+alltotal+' Are you will send mail ?',
                                                      boxWidth: '300px',
                                                      useBootstrap: false,
                                                      buttons: {
                                                          confirm: async function () {

                                                              let ax = itemAddr.split(',');
                                                              var startloop = ax.length;

                                                              ax.forEach(async function(item){
                                                                try {
                                                                    let transaction = await arweave.createTransaction({
                                                                    target: item,
                                                                    quantity: arweave.ar.arToWinston(c),
                                                                    data: arweave.utils.concatBuffers([d])
                                                                  }, wallet);

                                                                    transaction.addTag('App-Name', 'permamail');
                                                                    transaction.addTag('App-Version', '0.0.2');
                                                                    transaction.addTag('Unix-Time', o);


                                                                    await arweave.transactions.sign(transaction, wallet);
                                                                    const response = await arweave.transactions.post(transaction);

                                                                    $.alert({
                                                                      title: 'Success!',
                                                                      content: 'Your mail has been sent to ' + item,
                                                                      closeIcon: true,
                                                                      type: 'green',
                                                                      boxWidth: '300px',
                                                                      useBootstrap: false,
                                                                    });

                                                                } catch (e) {
                                                                  $.alert({
                                                                    title: 'Error!',
                                                                    content: 'Failed to send mail to ' + item,
                                                                    icon: 'fa fa-warning',
                                                                    type: 'red',
                                                                    closeIcon: true,
                                                                    boxWidth: '300px',
                                                                    useBootstrap: false,
                                                                  });

                                                                }
                                                                    startloop -= 1;
                                                                    if (startloop === 0) {
                                                                        $('#mmm').find('.loader').hide();
                                                                    }else {

                                                                    }
                                                              });
                                                          },
                                                          cancel: function () {


                                                          },

                                                      }
                                                  });
                                            }
                                          }
                                    }else {

                                        $.alert({
                                          title: 'Error!',
                                          content: item +' must make transaction first.',
                                          icon: 'fa fa-warning',
                                          type: 'red',
                                          closeIcon: true,
                                          boxWidth: '300px',
                                          useBootstrap: false,
                                        });
                                        this.$content.find('.loader').hide();
                                    }
                                  });
                          }
                      }else {
                        $.alert({
                          title: 'Error!',
                          content: 'Please check your wallet target!',
                          icon: 'fa fa-warning',
                          closeIcon: true,
                          type: 'red',
                          boxWidth: '300px',
                          useBootstrap: false,
                        });
                      }
                  }else {
                    $.alert({
                      title: 'Error!',
                      content: 'Please fill all form!',
                      icon: 'fa fa-warning',
                      type: 'red',
                      closeIcon: true,
                      boxWidth: '300px',
                      useBootstrap: false,
                    });
                  }

                  return false;
              }
          },
          cancel: function () {
              //close
          },

      },
      onContentReady: function () {
          // bind to events
          var jc = this;
          this.$content.find('form').on('submit', function (e) {
              // if the user submits the form by pressing enter in the field.
              e.preventDefault();
              jc.$$formSubmit.trigger('click'); // reference the button and click it
          });
      }
    });

}

//Close email
function closeMailContent() {
    document.getElementById('tab-email').style.display = "none";
    document.getElementById('tab-email-content').style.display = "none";
}

//Show About
function about() {
      closeNav();
      $.alert({
      title: 'Alert!',
      content: '<div class="mmm"><h1>About</h2></div><div class="mmm"><p>ARClient is a permaweb that is used to send and receive email through the Arweave network. By using an email client, you will be easier to manage email. ARClient was built based on the Arweave Blockchain and was developed by Aliceasua94 from an existing permaweb, Weavemail.</p> <p>You can see Weavemail on <a href="https://github.com/ArweaveTeam/weavemail">https://github.com/ArweaveTeam/weavemail</a></p> <p>&nbsp;</p> <p># How was it built?<br />ARClient uses the Arweave HTTP API, Arweave JS dan, and is published with Arweave Deploy.</p> <p>You can launch a copy by installing Arweave Deploy and running arweave deploy index.html --key-file [PATH_TO_KEY] --package. After the transaction is mined into a block, you will be able to access it at the given TXID, at the Arweave HTTPS gateway.</p> <p>&nbsp;</p> <p># Improved Features</p> <p>AEClient was built with the aim of enhancing the user experience, having an intuitive display, both in additional features and in the inbox. This is the advantage of AEClient that can help you work more effectively. Remember, AEClient does not support other email provider services such as GMAIL, YAHOO, or HOTMAIL. AEClient only works for Weavemail.</p> <p>&nbsp;</p> <p>1. Improved UI / UX appearance that is better and responsive. You can use this AEClient on Mobile and Desktop devices.</p> <p><br />2. Improved the appearance of the Inbox. We changed the appearance by adding user icons, titles, content, and time. In addition, you can display email content by clicking on the email you want. Then a popup message display will appear.</p> <p><br />3. Improved features in the Compose menu. You can send email to several Addresses at the same time (Multi Send). As for some additional validations for the address, the number of ar, and the content.</p> <p><br />4. Sorting content based on the latest time. Some problems that sometimes arise are the data does not appear according to the date the email was sent, but we have fixed it.</p> <p><br />5. Fee validation. You can see the total cost you must spend before you send an email. Of course, if your AR balance is insufficient, emails will not be sent.</p> <p><br />6. Add Contacts feature. To make it easier for users to send email, it will be easier to save contacts in your wallet. You can send emails directly from the selected address in the Contacts menu.</p> <p><br />7. Adds an Email Search feature to make it easier to find messages from a specific address. This is very useful if you have a lot of Inboxes.</p> <p><br />8. Direct add email receiver with url "?=to[address]"</p> <p><br />9. Added paginations for Inbox.</p></div>',
      theme:'compose',
    });
}

//Show account
function account() {
      closeNav();
      $.alert({
      title: 'Alert!',
      content: '<div class="mmm"><h1>My Account</h2></div><div class="mmm"><p style="word-break:break-all;">Wallet :<br/><a href="https://viewblock.io/arweave/address/'+myAddress+'" style="color:#e5e5e5;">'+myAddress+'</a></p><br/><p>Balance:<br/>'+myBalance+' AR</p></div>',
      theme:'compose',
    });
}

//Get Outbox
var outboxItem = "";
let arrayoutbox = [];
let sortoutbox = [];
async function outbox() {

  closeNav();

  if (arrayoutbox.length === 0) {
    $.alert({
    title: 'Alert!',
    content: '<div class="mmm"><h1>Outbox</h2></div><div class="mmm"><table><tbody id="outboxlisttable"></tbody></table></div>',
    theme:'compose',
    });
    const outx = await arweave.arql({
         op: "and",
         expr1: {
           op: "equals",
             expr1: "from",
             expr2: myAddress
         },
         expr2: {
             op:"equals",
             expr1:"App-Name",
             expr2: "permamail"

         }
   })
   outboxResult = outx;
   var outcount = outboxResult.length;
   if (outboxResult.length === 0) {

   }else {
     var datatarget = '';
     var timearr = '';
       outboxResult.forEach( async function(item){

            try {
                        const transaction = arweave.transactions.get(item).then(data => {
                        let arrx = [];
                        data.get('tags').forEach(tag => {
                        let value = tag.get('value', {decode: true, string: true});
                        let key = tag.get('name', {decode: true, string: true});
                        arrx.push(value);

                      });

                      datatarget = data.target;
                      timearr = arrx[2];

                      var jsonoutbox = '{"to":"'+datatarget+'", "tx":"'+item+'", "date":"'+timearr+'", "dateshow":"'+timeConverter(timearr)+'"}';
                      var objout = JSON.parse(jsonoutbox);

                      arrayoutbox.push(objout);
                      outcount -= 1;

                      if (outcount === 0) {
                          sortoutbox = arrayoutbox.sort(dynamicSort("-date"));
                          outboxShow();
                      }

                });
            } catch (e) {
                outcount -= 1;
            }


       });
   }
  }else {
      $.alert({
      title: 'Alert!',
      content: '<div class="mmm"><h1>Outbox</h2></div><div class="mmm"><table><tbody id="outboxlisttable"></tbody></table></div>',
      theme:'compose',
      onContentReady:function(){
          outboxShow();
      }
      });


  }


}

//Show outbox on Modal
function outboxShow() {
    var outboxtemplate = '';
    var cn = sortoutbox.length;
    sortoutbox.forEach(function(item, value){
        outboxtemplate += '<tr><td class="outto" style="color: #c8c7cd;">To : <a style="color: #c8c7cd;" href="https://viewblock.io/arweave/tx/'+item.tx+'">'+item.to+'</a></td><td class="outto" style="width: 80px;">'+item.dateshow+'</td></tr>';
            cn -= 1;
            if (cn === 0) {
                $('#outboxlisttable').append(outboxtemplate);
            }

    });
}
