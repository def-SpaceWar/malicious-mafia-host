import { Flex, Heading, Text, IconButton, Button, Spacer } from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import { doc, setDoc } from "firebase/firestore";
import { useFirestore } from "reactfire";
import { useState } from "react";

type ConfigureGameProps = {
  playerCount: number;
}

const ConfigureGame = (props: ConfigureGameProps) => {
  const firestore = useFirestore();

  const
    [villagerCount, setVillagerCount] = useState(0),
    [guardianCount, setGuardianCount] = useState(0),
    [mafiaCount, setMafiaCount] = useState(0),
    [jesterCount, setJesterCount] = useState(0);

  const setGameOption = (option: string) => (value: number) => {
    const data: Record<string, number> = {};
    data[option] = value;
    setDoc(doc(firestore, "gameData", "0"), data, { merge: true });
  };

  const save = () => {
    setGameOption("villagerCount")(villagerCount);
    setGameOption("guardianCount")(guardianCount);
    setGameOption("mafiaCount")(mafiaCount);
    setGameOption("jesterCount")(jesterCount);
  }

  const playersNeeded = villagerCount + guardianCount + mafiaCount + jesterCount;

  return (
    <Flex width="30vw" height="100vh" backgroundColor="darkBg" alignItems="center" padding="20px" flexDir="column" overflowY="scroll">
      <Heading padding="10px" paddingBottom="0px" fontSize="6xl" color="orange">Configure Game</Heading>
      <Flex fontSize="4xl" paddingTop="0px" padding="10px">
        Players needed:
        <Text marginLeft="8px" color={(playersNeeded == props.playerCount) ? "green" : "red"}>{playersNeeded}</Text>
      </Flex>
      <Button bgColor="yellow" fontSize="5xl" padding="30px" marginY={["10px", "10px"]} onClick={save}>Save</Button>

      <Heading padding="10px">Amount of Villagers: {villagerCount}</Heading>
      <Flex width="45%" bgColor="lightBg" padding="15px">
        <IconButton icon={<AddIcon />} aria-label="" backgroundColor="green" _hover={{ backgroundColor: "lightGreen" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setVillagerCount(villagerCount + 1)} />
        <Spacer />
        <IconButton icon={<CloseIcon />} aria-label="" backgroundColor="red" _hover={{ backgroundColor: "lightRed" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setVillagerCount(Math.max(0, villagerCount - 1))} />
      </Flex>

      <Heading padding="10px">Amount of Guardians: {guardianCount}</Heading>
      <Flex width="45%" bgColor="lightBg" padding="15px">
        <IconButton icon={<AddIcon />} aria-label="" backgroundColor="green" _hover={{ backgroundColor: "lightGreen" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setGuardianCount(guardianCount + 1)} />
        <Spacer />
        <IconButton icon={<CloseIcon />} aria-label="" backgroundColor="red" _hover={{ backgroundColor: "lightRed" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setGuardianCount(Math.max(0, guardianCount - 1))} />
      </Flex>

      <Heading padding="10px">Amount of Mafia: {mafiaCount}</Heading>
      <Flex width="45%" bgColor="lightBg" padding="15px">
        <IconButton icon={<AddIcon />} aria-label="" backgroundColor="green" _hover={{ backgroundColor: "lightGreen" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setMafiaCount(mafiaCount + 1)} />
        <Spacer />
        <IconButton icon={<CloseIcon />} aria-label="" backgroundColor="red" _hover={{ backgroundColor: "lightRed" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setMafiaCount(Math.max(0, mafiaCount - 1))} />
      </Flex>

      <Heading padding="10px">Amount of Jesters: {jesterCount}</Heading>
      <Flex width="45%" bgColor="lightBg" padding="15px">
        <IconButton icon={<AddIcon />} aria-label="" backgroundColor="green" _hover={{ backgroundColor: "lightGreen" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setJesterCount(jesterCount + 1)} />
        <Spacer />
        <IconButton icon={<CloseIcon />} aria-label="" backgroundColor="red" _hover={{ backgroundColor: "lightRed" }}
          fontSize="6xl" w="80px" h="80px"
          onClick={() => setJesterCount(Math.max(0, jesterCount - 1))} />
      </Flex>
    </Flex>
  );
};

export default ConfigureGame;
