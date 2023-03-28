import React, {useRef, useState, useEffect} from 'react';
import './App.css';

import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { doc, updateDoc } from "firebase/firestore";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import fireNaseAuthConfig from './fiebaseAuth.json';

import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

firebase.initializeApp(fireNaseAuthConfig);

//Global variables
const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  // Access user state, see if it is able to be used in user ?:
  const [user] = useAuthState(auth);
  return (
    <div className='App'>
    <header>
      <h1>Coracoid ://</h1>
      <p className='feedTitle'>Global Feed</p>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Quicksand"></link>
    </header>
    <div className='side-container'>
    <UserInfo/>
    {user ? <PopUpNewPost/>: <null></null>}
    <SignOut/>
    {user ? <null></null> : <SignIn/>}
    
    </div>
    <div className='core-container'>
    <section>
      {user ? <GlobalFeed/>: <null></null>}
    </section>
    </div>    
  </div>
  );
}

function PopUpNewPost() {
  return (
<Popup
    trigger={<div className='new-post-btn-container'><button className="new-post-btn"> New Post </button></div>} modal nested>
    {close => (
      <div className="modal">
        <button className="close" onClick={close}>
          &times;
        </button>
        <div className="header"> Create a new post </div>
        <div className="content">
          {' '}
          <p>What would you like to say?</p>
          <PopBoxInfo></PopBoxInfo>
        </div>
        
        <div className="actions">
          <button
            className="cancel-post-button"
            onClick={() => {
              console.log('modal closed ');
              close();
            }}
          >
            Cancel Post
          </button>
        </div>

      </div>
    )}
  </Popup>
  )
}

function PopBoxInfo() {
  // Access the messages on Firebase.
  const messagesRef = firestore.collection('messages');
  // Form for data upload
  const [formValue, setFormValue] = useState('');
  // Set uid, photoURL and display name to be used to send a message.
  const {uid, photoURL, displayName} = auth.currentUser
  const likes = 0;
  // Send Post method
  const sendPost = async(e) =>{
    // Prevent reload on message send. Send Post sends the message.
    e.preventDefault();

    // When a message is created add user info and message text.
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName,
      likes,
      likedBy: [],
      customID: '',
      likedBy: []
    }).then((createdRef) => {
      // DEBUG: console.log(value.id);
      
      // Get ID of object and set it to customID so it can be used to locate to be edited.
      createdRef.update({
        customID: createdRef.id
      });
    });


    // Reset form
    setFormValue('');
    // Move to new message
    window.scrollTo(0, 0);
  }

  // For definition of form
  return (
    <div>
    <form onSubmit={sendPost}>
      {/*formValue is used in messageRef ^ */}
      <textarea className='input-field' placeholder="Enter text..." value={formValue} onChange={(e) => setFormValue(e.target.value)}/>  
        <button className='post-send-btn' type='submit'>Create a new Post</button>
    </form>
    </div>
  )
}

function UserInfo(){
  // Check if user is valid before returning.
  return auth.currentUser && (
    <div className='bio-container'>
      <img className='bioImg' src={auth.currentUser.photoURL}></img>
      <p className='bioInfo'>Hello {auth.currentUser.displayName}!</p>
      <p className='bioInfo'>Email: {auth.currentUser.email}</p>
    </div>
  )

}

function SignIn(){
  const signInWithGoogle = () =>{
    // Add the google firebase provider.
    const provider = new firebase.auth.GoogleAuthProvider();
    // Use pop up
    auth.signInWithPopup(provider);
  }
    return (
    <>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )
}

function SignOut(){
  // Check is user state object is able to be accessed, if so then add a sign out btn.
  return auth.currentUser && (
    <div className='signOutBtnContainer'> 
    <button className="signOutBtn" onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  )
}

function GlobalFeed (){
  const dummy = useRef();
  // Access the messages on Firebase.
  const messagesRef = firestore.collection('messages');
    // Oreder messages by timestamp in a descending order
  const query = messagesRef.orderBy('createdAt', 'desc').limit(100);

  const options = {idField: 'id'}; // Add this line to specify the idField
  const [messages] = useCollectionData(query, options);

  return (
    <main>
    <div>
      {messages && messages.map(msg => <Post key={msg.id} messages={msg} />)}
      <div ref={dummy}></div>
    </div>
    </main>
  )
}


function Post(props){
  // A Post is a message box.
  const {text, uid, photoURL, displayName, likes, customID, likedBy} = props.messages;
  // Checks if the current user is sending the message, change CSS class if that is true.
  const messageClass = uid === auth.currentUser.uid ? 'send' : 'received';

  const messagesRef = firebase.firestore().collection('messages');

  const likePost = async(e) => {
    const docRef = messagesRef.doc(customID);
    await docRef.update({
      likes: likes+1,

      // WIP ----------
      likedBy: likedBy.push(auth.currentUser.displayName)
    });
  }
  
  
  return (
    <div className={`message ${messageClass}`}>
      <img className='messageUserImg' src={photoURL}/>
      <p className='chat-container-content-auth'>{displayName}</p>
      <div className='chat-container'>
        <p className='chat-container-content'>{text}</p>
      </div>
      <button onClick={likePost} className='chatLikeBtn'>Like</button>
        <p className='chatNumberLike'>Numper of likes: {likes}</p>
        <p>ID: {customID}</p>
        {/* WIP ---------------- */}
        {likedBy && likedBy.map(users => <div> <p>{users}</p> </div>)}

    </div>
  )
  
}

export default App;
