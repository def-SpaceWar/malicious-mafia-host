import { Text, Flex } from "@chakra-ui/react";

const RunGame = () => {
  return (
    <Flex width="30vw" height="100vh" backgroundColor="darkBg" alignItems="center" padding="20px" flexDir="column" overflowY="scroll">
      <Text>Game Running</Text>
    </Flex>
  )
}

export default RunGame;
