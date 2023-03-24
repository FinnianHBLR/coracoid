import React, {useRef, useState} from 'react';
import './App.css';

import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import fireNaseAuthConfig from './fiebaseAuth.json';

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
    </header>
    <div className='side-container'>
    <UserInfo/>
    <SignOut/>
      {user ? <null></null> : <SignIn/>}
    </div>
    <div className='core-container'>
      <div>
     
      </div>
    <section>
      {user ? <ChatRoom/>: <null></null>}
    </section>
    </div>
  </div>
  );
}

function UserInfo(){
  // Check if user is valid before returning.
  return auth.currentUser && (
    <div className='bio-container'>
      <img className='bioImg' src={auth.currentUser.photoURL}></img>
      <p className='bioInfo'>Hello {auth.currentUser.displayName}!</p>
      <p className='bioInfo'>Email: {auth.currentUser.email}</p>
      <p className='bioInfo'>Ph: {auth.currentUser.phoneNumber}</p>
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
    <button onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom (){
  const dummy = useRef();
  // Access the messages on Firebase.
  const messagesRef = firestore.collection('messages');
  // Oreder messages by timestamp
  const query = messagesRef.orderBy('createdAt').limit(25);
  const [messages] = useCollectionData(query, {idField: 'id'})
  // Form for data upload
  const [formValue, setFormValue] = useState('');
  // Set uid, photoURL and display name to be used to send a message.
  const {uid, photoURL, displayName} = auth.currentUser

  const sendMessage = async(e) =>{
    // Prevent reload on message send.
    e.preventDefault();

    // When a message is created add user info and message text.
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName
    })
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main>
    <div>
      {messages && messages.map(msg => <ChatMessage key={msg.id} messages={msg}/>)}
      <div ref={dummy}></div>
    </div>
    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)}/>
      <button type='submit'>Send message</button>
    </form>
    </main>
  )
}

function ChatMessage(props){
  const {text, uid, photoURL, displayName} = props.messages;
  // Checks if the current user is sending the message, change CSS class if that is true.
  const messageClass = uid === auth.currentUser.uid ? 'send' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img className='messageUserImg' src={photoURL}/>
      <p className='chat-container-content-auth'>{displayName}</p>
      <div className='chat-container'>
        <p className='chat-container-content'>{text}</p>
      </div>
      <button className='chatLikeBtn'>Like</button>
        <p className='chatNumberLike'>Numper of likes: 0</p>
    </div>
  )
  
}

export default App;
