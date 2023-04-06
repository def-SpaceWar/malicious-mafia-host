import { Flex, Button, Text } from "@chakra-ui/react";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

const HostGame = () => {
  const
    firestore = useFirestore(),
    lobbyCollection = collection(firestore, "lobby"),
    lobby = useFirestoreCollectionData(lobbyCollection),
    gamePlayersCollection = collection(firestore, "gamePlayers"),
    gamePlayers = useFirestoreCollectionData(gamePlayersCollection);

  const
    everyoneReady = (): boolean => {
      if (!lobby.data) return false;
      let everyoneReady = true;
      lobby.data.map(m => everyoneReady = everyoneReady && m.ready);
      return everyoneReady;
    },
    hasGameStarted = (): boolean => {
      if (gamePlayers.data?.length == 0) return false;
      return true;
    },
    startGame = () => {
      if (lobby.data?.length == 0) return;
      // randomly generate roles here too eventually
      lobby.data.map((m) => {
        setDoc(doc(firestore, "gamePlayers", m.uid), {
          name: m.displayName,
          uid: m.uid,
          email: m.email,
          role: "villager",
          association: "innocent"
        });
      });
    },
    stopGame = () => {
      if (gamePlayers.data.length == 0) return;
      gamePlayers.data.map((m) => {
        deleteDoc(doc(firestore, "gamePlayers", m.uid));
      });
    };

  return (
    <Flex justifyContent="center" alignItems="center" width="100vw" height="100vh">
      {
        (!hasGameStarted() && everyoneReady())
          ? <Button fontSize="6xl" bgColor="green" _hover={{ backgroundColor: "lightGreen" }} width="35vw" height="10vh" onClick={startGame}>Start Game</Button>
          : (!hasGameStarted())
            ? <Button fontSize="6xl" bgColor="darkGreen" _hover={{ backgroundColor: "darkGreen" }} width="35vw" height="10vh" isDisabled>Start Game</Button>
            : <Button fontSize="6xl" bgColor="red" _hover={{ backgroundColor: "lightRed" }} width="35vw" height="10vh" onClick={stopGame}>Stop Game</Button>
      }
    </Flex>
  )
};

export default HostGame;
