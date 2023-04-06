import { getFirestore } from "firebase/firestore";
import { FirestoreProvider, useFirebaseApp } from "reactfire";
import HostGame from "./HostGame";

const App = () => {
  const
    firebaseApp = useFirebaseApp(),
    firestore = getFirestore(firebaseApp);

  return (
    <FirestoreProvider sdk={firestore}>
      <HostGame />
    </FirestoreProvider>
  );
};

export default App;
