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
const storage = firebase.storage();

const dbHelper = {
  async fetchItems(collectionName, limitVal = null) {
    try {
      let query = db.collection(collectionName).orderBy('created_at', 'desc');
      if (limitVal) {
        query = query.limit(limitVal);
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 15 seconds. Please check your internet connection.")), 15000)
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

  async insertItem(collectionName, itemData) {
    try {
      const data = {
        ...itemData,
        created_at: new Date().toISOString()
      };
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database request timed out after 15 seconds. Please check your internet connection.")), 15000)
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
        setTimeout(() => reject(new Error("Database request timed out after 15 seconds. Please check your internet connection.")), 15000)
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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            const maxWidth = 800; // Reduced size to stay under Firestore 1MB limit
            const maxHeight = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Return as base64 string directly
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = () => resolve(event.target.result); // Fallback to original
          img.src = event.target.result;
        } else {
          // Non-image file, just return base64
          resolve(event.target.result);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};
