        // Firebase configuration
     const firebaseConfig = {
  apiKey: "AIzaSyDCrz0ms3QTrGAdLOJ9A8VuJ-vvJtN2ues",
  authDomain: "main-library-ggcg.firebaseapp.com",
  projectId: "main-library-ggcg",
  storageBucket: "main-library-ggcg.firebasestorage.app",
  messagingSenderId: "438092954922",
  appId: "1:438092954922:web:96f1fb34bc32d8d7017253",
  measurementId: "G-KXZ751SCW3"
};


        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();