import { Flex, Button, Text } from "@chakra-ui/react";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import ConfigureGame from "./ConfigureGame";
import RunGame from "./RunGame";

type Role = "villager" | "guardian" | "mafia" | "jester";
type Association = "innocent" | "mafia" | "third-party";

const numberToData = (n: number): { role: Role, association: Association } => {
  let role: Role = "villager";
  let association: Association = "innocent";

  if (n == 1) role = "guardian";
  if (n == 2) role = "mafia", association = "mafia";
  if (n == 3) role = "jester", association = "third-party";

  return { role, association };
};

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

      let
        villagerCount = 0,
        guardianCount = 0,
        mafiaCount = 0,
        jesterCount = 0;

      gameData.data.map(m => {
        villagerCount = m.villagerCount;
        guardianCount = m.guardianCount;
        mafiaCount = m.mafiaCount;
        jesterCount = m.jesterCount;
      });

      const roles: number[] = [];
      for (let i = 0; i < villagerCount; i++) roles.push(0);
      for (let i = 0; i < guardianCount; i++) roles.push(1);
      for (let i = 0; i < mafiaCount; i++) roles.push(2);
      for (let i = 0; i < jesterCount; i++) roles.push(3);

      const shuffle = (a: any[]) => {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      shuffle(roles);

      lobby.data.map((m) => {
        const identity = numberToData(roles.pop()!);
        setDoc(doc(firestore, "gamePlayers", m.uid), {
          name: m.displayName,
          uid: m.uid,
          email: m.email,
          role: identity.role,
          association: identity.association
        });
        deleteDoc(doc(firestore, "lobby", m.uid));
      });

      setDoc(doc(firestore, "gameData", "0"), { timeOfDay: "night" }, { merge: true });
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
          ? <ConfigureGame playerCount={lobby.data.length} />
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
