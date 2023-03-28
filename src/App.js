import React, {useRef, useState} from 'react';
import './App.css';

import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

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
    <div className='sideContainer'>
    <UserInfo/>
    {user ? <PopUpNewPost/>: <null></null>}
    <SignOut/>
    {user ? <null></null> : <SignIn/>}
    
    </div>
    <div className='coreContainer'>
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
    trigger={<div className='newPostBtnContainer'><button className="newPostBtn"> New Post </button></div>} modal nested>
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
            className="cancelPostBtn"
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
  // Access the post on Firebase.
  const postRef = firestore.collection('posts');
  // Form for data upload
  const [formValue, setFormValue] = useState('');
  // Set uid, photoURL and display name to be used to send a post.
  const {uid, photoURL, displayName} = auth.currentUser
  const likes = 0;
  // Send Post method
  const sendPost = async(event) =>{
    // Prevent reload on post send. Send Post sends the post.
    event.preventDefault();

    // When a post is created add user info and post text.
    await postRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName,
      likes,
      likedBy: [],
      likedByName: [],
      customID: '',
    }).then((createdRef) => {
      // DEBUG: console.log(value.id);
      
      // Get ID of object and set it to customID so it can be used to locate to be edited.
      createdRef.update({
        customID: createdRef.id
      });
    });


    // Reset form
    setFormValue('');
    // Move to new post
    window.scrollTo(0, 0);
  }

  // For definition of form
  return (
    <div>
    <form onSubmit={sendPost}>
      {/*formValue is used in postRef.add ^ */}
      <textarea className='inputField' placeholder="Enter text..." value={formValue} onChange={(event) => setFormValue(event.target.value)}/>  
        <button className='postSendBtn' type='submit'>Create a new Post</button>
    </form>
    </div>
  )
}

function UserInfo(){
  // Check if user is valid before returning.
  return auth.currentUser && (
    <div className='bioContainer'>
      <img alt="User profile" className='bioImg' src={auth.currentUser.photoURL}></img>
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
      <button className='signInBtn' onClick={signInWithGoogle}>Sign in with Google</button>
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
  // Access the posts on Firebase.
  const postRef = firestore.collection('posts');
    // Order posts by timestamp in a descending order
  const query = postRef.orderBy('createdAt', 'desc').limit(100);

  const options = {idField: 'id'}; // Add this line to specify the idField
  const [posts] = useCollectionData(query, options);

  return (
    <main>
    <div>
      {posts && posts.map(post => <Post key={post.id} post={post} />)}
      <div ref={dummy}></div>
    </div>
    </main>
  )
}


function Post(props){
  // Post info from global feed.
  const {text, uid, photoURL, displayName, likes, customID, likedBy, likedByName} = props.post;
  // Checks if the current user is sending the post, change CSS class if that is true.
  // If it's sent from the current user
  const postClass = uid === auth.currentUser.uid ? 'send' : 'received';
  // If the current user has already liked the post..
  const likedByBool = likedBy.includes(auth.currentUser.uid) ? true : false;

  // Firebnase collection to get post so they can be updated.
  const postRef = firebase.firestore().collection('posts');

  const likePost = async(event) => {
    // Get post object by ID.
    const docRef = postRef.doc(customID);
    
    if(likedByBool){
        // If user has already liked post they cannot add to it.
      } else {
        // User has not liked post and is now liking it.
      const addedUIDList = likedBy.concat(auth.currentUser.uid);
      const addedNameList = likedByName.concat(auth.currentUser.displayName);
      // Use information to update object
      await docRef.update({
        likes: likes+1,
        likedBy: addedUIDList,
        likedByName: addedNameList
      });
    }
  }
  
  return (
    
    <div className={`post ${postClass}`}>
      {/* Post info */}
      <img alt="User profile" className='postUserImg' src={photoURL}/>
      {/* If postClass == true , it means the message was received annd you're not the Author. Add 'you' otherwise */}
      <p className='postContainerContentAuth'>{(postClass == 'received') ?`\@${displayName}` : `\@${displayName} (You)`}</p>
      <div className='postContainer'>
        <p className='postContainerContent'>{text}</p>
      </div>
      {/* if like btn is pressed, use likePost to update db */}
      <button onClick={likePost} className={`postLikeBtn ${likedByBool ? 'disabled' : ''}`}>Like</button>
      {/* If user has liked the post, message is displayed, otherwise it is null */}
      {likedByBool ? <p className='alreadyLiked'>{'You liked this post!'}</p> : <null></null>}
        <p className='postNumberLike'>Numper of likes: {likes}</p>
        {/* List of people who have liked each post using a map */}
        <div className='likedByNameContainer'>
          <p className='likedByNames'>Liked By:</p>
            {likedByName && likedByName.map(userName => <p className='likedByNames'>{` ${userName}`}</p>)}
        <p className='likedByNames'>...</p>
        </div>
    </div>
  )
  
}

export default App;
