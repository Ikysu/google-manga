var list = document.getElementById("list");
var inf = document.getElementById("info");
var com_list = document.getElementsByClassName("comments-list")[0]
var icon = "https://manga.iky.su/unnamed.jpg";
var readMethod = true; // Вертикальная - true | Горизонтальная - false // Пока в разработке
var gScopes = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.readonly"
var firstAuth = true;
var workForm;
var comForm;
var fId;

window.onhashchange=()=>{
    window.location.reload()
}


function removeWorkForm(data=null){
    if(data){
        workForm={
            form:data.form,
            exit:{
                text:data.text,
                clas:data.clas,
                cb:data.cb
            }
        }
    }else{
        if(workForm){
            try {
                var btn = workForm.form.parentElement.getElementsByClassName(workForm.exit.clas)[0]
                btn.innerText=workForm.exit.text
                btn.onclick=workForm.exit.cb
            } catch (error) {
                console.log(error)
            }
            workForm.form.remove()
            workForm=null;
        }
    }
}



function info(text){
    inf.innerHTML="IR:"+text
}


function setCheck(){
    info("WAIT")
    var aller1 = true;
    var aller2 = true;
    var wait=setInterval(async ()=>{
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            if(gapi.auth2.getAuthInstance().currentUser.get().hasGrantedScopes(gScopes)){
                icon = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getImageUrl()
                await clearInterval(wait)
                setTimeout(() => {
                    listFiles();
                }, 500);
            }else{
                gapi.auth2.getAuthInstance().currentUser.get().disconnect()
                if(aller2){
                    aller1=false;
                    aller2=false;
                    alert("Bad scopes. Reauth.")
                }
            }
        }else{
            if(aller1){
                aller1=false;
                //alert("Login in google account.")
            }
        }
    },1000)
}

function handleClientLoad() {
    info("INIT")
    gapi.load('client:auth2', initClient);
    setCheck()
}

function initClient() {
    info("AUTH")
    return gapi.client.init({
        apiKey: 'AIzaSyBXIVIPiLXuDS7c6dd2hTDQvjOlmcCxMFw',
        clientId: '397299217655-3hfub8ge35f85jvdr80kh8b0gklv4ut9.apps.googleusercontent.com',
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        scope: gScopes
    }).then(function () {
        info("AUTHED")
    }, function(error) {
        console.log(error)
        info("ERR")
    });
}

function listFiles() {
    info("GET")
    if(window.location.hash){
        var sp = window.location.hash.slice(1) // Get folder id
        if(sp.length>0){
            gapi.client.drive.files.list({ // Getting all files in folder
                "q": `'${sp}' in parents`,
                "fields": 'files(id,name,owners)',
            }).then(async function(response) {
                var files = response.result.files;
                var e = {images:[],authors:{}};
                var out=[];
                response.result.files.forEach(file=>{
                    out.push(file.name)
                    e.images[file.name]=file.id
                    file.owners.forEach(owner=>{
                        var own = {
                            name:owner.displayName,
                            photo:owner.photoLink,
                            me:owner.me
                        }

                        if(!e.authors[owner.emailAddress]){
                            e.authors[owner.emailAddress]=own
                        }
                    })
                })

                var l=out.sort((n1, n2)=>{
                    const file_1 = n1.split(".")[0];
                    const file_2 = n2.split(".")[0];
                    return file_1 - file_2;
                });

                for(let i=0;i<l.length;i++){
                    var img = new Image(); 
                    img.src="https://drive.google.com/uc?id="+e.images[l[i]]
                    list.appendChild(img)
                }

                var creators = document.createElement("div")
                creators.classList.add("creators")
                var creatorsText = document.createElement("h3")
                creatorsText.innerHTML="Author"+((e.authors.length>1)?"s":"")+":"
                creatorsText.classList.add("creators-text")
                creators.appendChild(creatorsText)
                
                Object.keys(e.authors).forEach(au=>{
                    var author = e.authors[au];
                    var line = document.createElement("div")
                    line.classList.add("line")
                    line.classList.add("preCommentsText")
                    var lineLeft = document.createElement("div")
                    lineLeft.classList.add("line-left")
                    var creatorImg = document.createElement("img")
                    creatorImg.classList.add("avatar")
                    creatorImg.classList.add("author-avatar")
                    creatorImg.src=author.photo
                    lineLeft.appendChild(creatorImg)
                    var creatorUsername = document.createElement("username")
                    creatorUsername.classList.add("username")
                    creatorUsername.innerText=author.name+((author.me)?" (me)":"")
                    lineLeft.appendChild(creatorUsername)
                    line.appendChild(lineLeft)
                    creators.appendChild(line)
                })
                
                await list.appendChild(creators)

                fId = e.images[l[l.length-1]]

                comForm = await document.getElementsByClassName("comments-form-text")[0];
                comForm.style.display="none"

                setForm(fId)
                getCommentsList(fId)
                info("OK")

                // READ METHOD
            }, function (error) {
                console.log(error)
                info(error.status)
                if(error.code==404){
                    alert("Folder not found!")
                }else{
                    alert("Something wrong..\n"+error.result.error.message);
                }
                
                //setCheck()
            });
        }else{
            info("404")
        }
    }else{
        info("404")
    }
}

function renderButton() {
    gapi.signin2.render('auth', {
        'scope': 'profile '+gScopes,
        'width': 180,
        'height': 30,
        'longtitle': true,
        "theme":"dark",
        onSuccess:(e)=>{
            if(firstAuth){
                firstAuth=false
            }else{
                window.location.reload()
            }
        }
    });
}

function createInputForm(_, cb, err, text, preText=""){
    _.innerHTML="";
    var a=document.createElement("div");
    var line=document.createElement("div")
    var lineLeft=document.createElement("div")
    var lineRight=document.createElement("div")
    var formBtn=document.createElement("button")
    a.ariaPlaceholder="Write a comment...";
    a.classList.add("comment-sender")
    a.contentEditable=true;
    a.innerText=preText
    line.classList.add("line")
    line.style.paddingTop="10px"
    lineLeft.classList.add("line-left")
    lineRight.classList.add("line-right")
    formBtn.classList.add("form-btn")
    formBtn.classList.add("btn")
    formBtn.innerText=text

    formBtn.onclick=(e)=>{
        formBtn.onclick=()=>{}
        formBtn.disabled=true
        
        if(a.innerText.length>0){
            cb(a.innerText)
        }else{
            err()
        }
    }

    lineRight.appendChild(formBtn)
    line.appendChild(lineLeft)
    line.appendChild(lineRight)
    _.appendChild(a)
    _.appendChild(line)
    setTimeout(a.focus(), 10);
}

function setForm(fId) {
    comForm.innerHTML="Write a comment...";
    comForm.onclick=(e)=>{
        comForm.onclick=()=>{}
        createInputForm(comForm, (text)=>{
            gapi.client.drive.comments.create({
                "fileId": fId,
                "fields": '*',
            }, {
                "content": text
            }).then(function(response) {
                var comment = response.result
                createComment("_", comment.author.me, comment.id, comment.author.photoLink, comment.author.displayName, new Date(comment.modifiedTime).getTime(), comment.content)
            }).catch(function (error){
                alert("Error! Comments disabled.")
                console.log("COMMENT ERROR",error.result.error.message)
                console.log(error)
            })
            setTimeout(setForm, 10, fId);
        }, ()=>{
            alert("Please enter at least one character!")
            setTimeout(setForm, 10, fId);
        }, "Send")          
    }
}


function createComment(_, me, id, avatar, username, date, comment) {
    var comAll = document.createElement("div")
    comAll.classList.add("comment")
    comAll.id="comment_"+id
    
    var comBody = document.createElement("div")
    comBody.classList.add("comment-body")

        var comHead = document.createElement("div")
        comHead.classList.add("line")

            var comUser = document.createElement("div")
            comUser.classList.add("line-left")

                var comAvatar = document.createElement("img")
                comAvatar.classList.add("avatar")
                comAvatar.classList.add("comment-avatar")
                if(avatar==null) avatar="https://manga.iky.su/unnamed.jpg"
                comAvatar.src=avatar
                comUser.appendChild(comAvatar)

                var comUsername = document.createElement("span")
                comUsername.classList.add("username")
                comUsername.innerText=username
                comUser.appendChild(comUsername)

                var comTime = document.createElement("span")
                comTime.classList.add("comment-time")
                comTime.innerText=moment(date).locale("ru").fromNow()
                comUser.appendChild(comTime)

            comHead.appendChild(comUser)

            // Rating
            
        comBody.appendChild(comHead)

        var comContent = document.createElement("div")
        comContent.classList.add("comment-content")
        comContent.innerText=comment
        comBody.appendChild(comContent)

        if(_==null||_=="_"){
            var comBtnLink = document.createElement("button")
            comBtnLink.classList.add("comment-btn-link")
            comBtnLink.classList.add("btn")
            comBtnLink.innerText="reply"
            // Ответ на комментарий (добавить функцию)

            function reply(){
                comBtnLink.innerText="cancel"
                comBtnLink.onclick=()=>{
                    removeWorkForm()
                }
                removeWorkForm()
                removeWorkForm({form:document.createElement("div"),text:"reply",clas:"comment-btn-link",cb:reply})
                workForm.form.classList.add("comments-form-text")
                createInputForm(workForm.form, (text)=>{
                    gapi.client.drive.replies.create({
                        "fileId": fId,
                        "commentId": id,
                        "fields": '*',
                    }, {
                        "content": text
                    }).then(function(response) {
                        console.log(response)
                        var comment = response.result
                        createComment(id, comment.author.me, comment.id, comment.author.photoLink, comment.author.displayName, new Date(comment.modifiedTime).getTime(), comment.content)
                    }).catch(function (error){
                        alert("Error! Comments disabled.")
                        console.log("COMMENT ERROR",error.result.error.message)
                        console.log(error)
                    })
                    comBtnLink.innerText="reply"
                    setTimeout(()=>{
                        removeWorkForm()
                        comBtnLink.onclick=reply
                    },10)
                }, ()=>{
                    alert("Please enter at least one character!")
                    setTimeout(()=>{
                        removeWorkForm()
                        comBtnLink.onclick=reply
                    },10)
                }, "Send")
                comBody.appendChild(workForm.form)
            }

            comBtnLink.onclick=reply

            comBody.appendChild(comBtnLink)
        }

        if(me){
            var comBtnEdit = document.createElement("button")
            comBtnEdit.classList.add("comment-btn-edit")
            comBtnEdit.classList.add("btn")
            comBtnEdit.innerText="edit"

            function editCom () {
                comBtnEdit.innerText="cancel"
                comBtnEdit.onclick=()=>{
                    removeWorkForm()
                }
                removeWorkForm()
                removeWorkForm({form:document.createElement("div"),text:"reply",clas:"comment-btn-edit",cb:reply})
                workForm.form.classList.add("comments-form-text")
                createInputForm(workForm.form, (text)=>{
                    if(_==null||_=="_"){
                        gapi.client.drive.comments.update({
                            "fileId": fId,
                            "commentId": id,
                            "fields": '*'
                        },{
                            "content": text
                        }).then(function(response) {
                            comContent.innerText=text
                            setTimeout(()=>{
                                removeWorkForm()
                                comBtnEdit.onclick=editCom
                            },10)
                        }).catch(function (error){
                            alert("Error! Comments disabled.")
                            console.log("COMMENT ERROR",error.result.error.message)
                            console.log(error)
                        })
                    }else{
                        gapi.client.drive.replies.update({
                            "fileId": fId,
                            "commentId": _,
                            "replyId":id,
                            "fields": '*'
                        },{
                            "content": text
                        }).then(function(response) {
                            comContent.innerText=text
                            setTimeout(()=>{
                                removeWorkForm()
                                comBtnEdit.onclick=editCom
                            },10)
                        }).catch(function (error){
                            alert("Error! Comments disabled.")
                            console.log("COMMENT ERROR",error.result.error.message)
                            console.log(error)
                        })
                    }
                }, ()=>{
                    alert("Please enter at least one character!")
                    setTimeout(()=>{
                        removeWorkForm()
                        comBtnEdit.onclick=editCom
                    },10)
                }, "Save", comContent.innerText)
                comContent.appendChild(workForm.form)
            }

            comBtnEdit.onclick=editCom

            comBody.appendChild(comBtnEdit)

            var comBtnRemove = document.createElement("button")
            comBtnRemove.classList.add("comment-btn-remove")
            comBtnRemove.classList.add("btn")
            comBtnRemove.innerText="delete"

            comBtnRemove.onclick=()=>{
                comBtnRemove.disabled=true
                comBtnRemove.onclick=()=>{}
                if(confirm("Delete?")){
                    if(_==null||_=="_"){
                        gapi.client.drive.comments.delete({
                            "fileId": fId,
                            "commentId": id
                        }).then(function(response) {
                            comAll.remove()
                        })
                    }else{
                        gapi.client.drive.replies.delete({
                            "fileId": fId,
                            "commentId": _,
                            "replyId":id
                        }).then(function(response) {
                            comAll.remove()
                        })
                    }
                }
            }
            comBody.appendChild(comBtnRemove)
        }

        var comChildren = document.createElement("div")
        comChildren.classList.add("comment-children")

    comAll.appendChild(comBody)
    comAll.appendChild(comChildren)

    if(_==null){
        com_list.appendChild(comAll)
    }else if(_=="_"){
        com_list.prepend(comAll)
    }else{
        var parent = document.getElementById("comment_"+_).getElementsByClassName("comment-children")[0]
        parent.appendChild(comAll)
    }
    
}

function getCommentLength(id) {
    var p = document.getElementById("comment_"+id)
    if(p){
        p=p.parentElement
        if(p.classList.contains("comment-child")){
            return getCommentLength(p.parentElement.id.split("_")[1])
        }else if(p.classList.contains("comments-list")){
            return 1;
        }else{
            throw "Ошибка развертки"
        }
    }else{
        throw "Комент не найден"
    }
    
}

function getCommentsList(fId){
    console.log("fId:",fId)
    gapi.client.drive.comments.list({ // Getting all files in folder
        "fileId": fId,
        "fields": '*',
    }).then(function(response) {
        var comments = response.result.comments
        
        function setComment(i){
            createComment(null, comments[i].author.me, comments[i].id, comments[i].author.photoLink, comments[i].author.displayName, new Date(comments[i].modifiedTime).getTime(), comments[i].content)
            
            for(let ii=0;ii<((comments[i].replies.length<11)?comments[i].replies.length:10);ii++){
                createComment(
                    comments[i].id, 
                    comments[i].replies[ii].author.me, 
                    comments[i].replies[ii].id, 
                    comments[i].replies[ii].author.photoLink, 
                    comments[i].replies[ii].author.displayName, 
                    new Date(comments[i].replies[ii].modifiedTime).getTime(), 
                    comments[i].replies[ii].content
                )
            }
        
        }

        

        for(let i=0;i<((comments.length<11)?comments.length:10);i++){
            console.log(i,comments[i])
            setComment(i)
        }

        if(comments.length>10){
            var btn = document.getElementsByClassName("allComments")[0]
            btn.hidden=false
            btn.onclick=()=>{
                btn.remove()
                for(let i=10;i<comments.length;i++){
                    setComment(i)
                }
            }
        }

        list.style.padding="10px 0 10px 0"
        comForm.style.display="block";
        
    })
        
}