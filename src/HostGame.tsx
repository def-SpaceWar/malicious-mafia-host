import { Flex, Button, Text } from "@chakra-ui/react";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import ConfigureGame from "./ConfigureGame";
import RunGame from "./RunGame";

const HostGame = () => {
  const
    firestore = useFirestore(),
    lobbyCollection = collection(firestore, "lobby"),
    lobby = useFirestoreCollectionData(lobbyCollection),
    gamePlayersCollection = collection(firestore, "gamePlayers"),
    gamePlayers = useFirestoreCollectionData(gamePlayersCollection),
    gameDataCollection = collection(firestore, "gameData"),
    gameData = useFirestoreCollectionData(gameDataCollection);

  const
    everyoneReady = (): boolean => {
      if (lobby.data.length == 0) return false;
      let everyoneReady = true;
      lobby.data.map(m => everyoneReady = everyoneReady && m.ready);
      return everyoneReady;
    },
    peopleReady = () => {
      let count = 0;
      lobby.data.map(m => count += m.ready ? 1 : 0);
      return count;
    },
    hasGameStarted = (): boolean => {
      if (gamePlayers.data?.length == 0) return false;
      return true;
    },
    areRolesOk = (): boolean => {
      let peopleCount = lobby.data.length;
      gameData.data.map(m => {
        peopleCount -= m.villagerCount;
        peopleCount -= m.guardianCount;
        peopleCount -= m.mafiaCount;
        peopleCount -= m.jesterCount;
      });
      return peopleCount == 0;
    },
    startGame = () => {
      if (lobby.data?.length == 0) return;

      // randomly assign roles here too eventually

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
    <Flex width="100vw" height="100vh">
      {
        (!hasGameStarted())
          ? <ConfigureGame playerCount={lobby.data.length}/>
          : <RunGame />
      }
      <Flex justifyContent="center" alignItems="center" width="70vw" height="100vh" flexDir="column">
        {
          (!hasGameStarted() && everyoneReady() && areRolesOk())
            ? (
              <>
                <Text fontSize="6xl">{peopleReady()}/{lobby.data.length} - Ok!</Text>
                <Button fontSize="6xl" bgColor="green" _hover={{ backgroundColor: "lightGreen" }} width="35vw" height="10vh" onClick={startGame}>Start Game</Button>
              </>
            )
            : (!hasGameStarted() && everyoneReady())
              ? (
                <>
                  <Text fontSize="6xl">{peopleReady()}/{lobby.data.length} - Configure/Save Settings!</Text>
                  <Button fontSize="6xl" bgColor="darkGreen" _hover={{ backgroundColor: "darkGreen" }} width="35vw" height="10vh" isDisabled>Start Game</Button>
                </>
              )
              : (!hasGameStarted())
                ? (
                  <>
                    <Text fontSize="6xl">{peopleReady()}/{lobby.data.length} - Not Ready!</Text>
                    <Button fontSize="6xl" bgColor="darkGreen" _hover={{ backgroundColor: "darkGreen" }} width="35vw" height="10vh" isDisabled>Start Game</Button>
                  </>
                )
                : <Button fontSize="6xl" bgColor="red" _hover={{ backgroundColor: "lightRed" }} width="35vw" height="10vh" onClick={stopGame}>Stop Game</Button>

        }
      </Flex>
    </Flex>
  )
};

export default HostGame;
