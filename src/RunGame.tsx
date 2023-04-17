import { Text, Flex, Button } from "@chakra-ui/react";
import { collection } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

const RunGame = () => {
  const
    firestore = useFirestore(),
    gamePlayersCollection = collection(firestore, "gamePlayers"),
    gamePlayers = useFirestoreCollectionData(gamePlayersCollection),
    gameDataCollection = collection(firestore, "gameData"),
    gameData = useFirestoreCollectionData(gameDataCollection);

  const
    haveMafiasSelected = (): boolean => {
      let selected = true;

      gamePlayers.data?.map((m) => {
        if (m.role != "mafia") return;
        selected = selected && (m.selectedTarget != undefined);
      });

      return selected;
    },
    haveGuardiansSelected = (): boolean => {
      let selected = true;

      gamePlayers.data?.map((m) => {
        if (m.role != "guardian") return;
        selected = selected && (m.selectedTarget != undefined);
      });

      return selected;
    },
    isReady = (): boolean => {
      return haveMafiasSelected() && haveGuardiansSelected();
    };

  return (
    <Flex
      width="30vw" height="100vh"
      backgroundColor="darkBg"
      alignItems="center" justifyContent="center" padding="20px"
      flexDir="column" rowGap="25px"
    >
      {
        isReady()
          ? <Button
            fontSize="5xl"
            padding="30px"
            bgColor="blue"
            _hover={{ backgroundColor: "lightBlue" }}
          >Continue</Button>
          : <Button
            fontSize="5xl"
            padding="30px"
            bgColor="darkBlue"
            isDisabled
          >Continue</Button>
      }
      <Text fontSize="4xl">Mafias Ready: <Text display="inline" color={haveMafiasSelected() ? "green" : "red"}>{haveMafiasSelected().toString()}</Text></Text>
      <Text fontSize="4xl">Guardians Ready: <Text display="inline" color={haveGuardiansSelected() ? "green" : "red"}>{haveGuardiansSelected().toString()}</Text></Text>
    </Flex>
  )
}

export default RunGame;
