const firebaseConfig = {
  apiKey: "AIzaSyC566kR6_SM6UAD9CRNY4ozSxH42-_MCiQ",
  authDomain: "chrissels-8d89a.firebaseapp.com",
  projectId: "chrissels-8d89a",
  storageBucket: "chrissels-8d89a.firebasestorage.app",
  messagingSenderId: "415985441043",
  appId: "1:415985441043:web:ed0db9eb58ca093e4362e6",
  measurementId: "G-W9HHJTFZ0R"
};

// Initialize Firebase compat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const dbHelper = {
  async fetchItems(collectionName, limitVal = null) {
    try {
      let query = db.collection(collectionName).orderBy('created_at', 'desc');
      if (limitVal) {
        query = query.limit(limitVal);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 60 seconds. Please check your internet connection or wait longer.")), 60000)
      );

      const snapshot = await Promise.race([query.get(), timeoutPromise]);
      
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return { data: items, error: null };
    } catch (error) {
      console.error(`Error fetching from ${collectionName}:`, error);
      return { data: null, error };
    }
  },

  async fetchItemById(collectionName, id) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 60 seconds. Please check your internet connection or wait longer.")), 60000)
      );
      const doc = await Promise.race([db.collection(collectionName).doc(id).get(), timeoutPromise]);
      if (doc.exists) {
        return { data: { id: doc.id, ...doc.data() }, error: null };
      } else {
        return { data: null, error: new Error("Document not found") };
      }
    } catch (error) {
      console.error(`Error fetching document ${id} from ${collectionName}:`, error);
      return { data: null, error };
    }
  },

  async insertItem(collectionName, itemData) {
    try {
      const data = {
        ...itemData,
        created_at: new Date().toISOString()
      };
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 60 seconds. Please check your internet connection or wait longer.")), 60000)
      );
      const docRef = await Promise.race([db.collection(collectionName).add(data), timeoutPromise]);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      console.error(`Error inserting into ${collectionName}:`, error);
      return { data: null, error };
    }
  },

  async updateItem(collectionName, id, itemData) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 60 seconds. Please check your internet connection or wait longer.")), 60000)
      );
      await Promise.race([db.collection(collectionName).doc(id).update(itemData), timeoutPromise]);
      return { error: null };
    } catch (error) {
      console.error(`Error updating in ${collectionName}:`, error);
      return { error };
    }
  },

  async deleteItem(collectionName, id) {
    try {
      await db.collection(collectionName).doc(id).delete();
      return { error: null };
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      return { error };
    }
  },

  async uploadFile(file) {
    const formData = new FormData();
    // Using the ImgBB API key provided by the user
    formData.append('key', '779c9ec19b9f5c8189fc20c8ae228314');
    formData.append('image', file);
    
    try {
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Return the direct URL to the image hosted on ImgBB
        return data.data.url;
      } else {
        throw new Error(data.error.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw error;
    }
  }
};
