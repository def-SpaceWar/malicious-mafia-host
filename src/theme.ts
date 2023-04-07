import { extendTheme } from "@chakra-ui/react"

export const theme = extendTheme({
    colors: {
        fg: "#CCEEFF",
        darkFg: "#AACCEE",
        lightFg: "#FFFFFF",

        bg: "#112233",
        darkBg: "#0E1C2A",
        lightBg: "#162C42",

        red: "#FA3154",
        darkRed: "#BB2C44",
        lightRed: "#FF82A8",

        green: "#21FF86",
        darkGreen: "#11BB66",
        lightGreen: "#82FFB6",

        yellow: "#F8E866",
        darkYellow: "#CCC055",
        lightYellow: "#FFFF88",

        blue: "#32A6FF",
        darkBlue: "#2186CC",
        lightBlue: "#64BBFF",

        cyan: "#56EFFF",
        darkCyan: "#2BBCCA",
        lightCyan: "#88FFFF",

        purple: "#A656FF",
        darkPurple: "#863BCC",
        lightPurple: "#BB78FF",

        magenta: "#FF6EEF",
        darkMagenta: "#BB44AB",
        lightMagenta: "#FF88FF",

        orange: "#F69643",
        darkOrange: "#B66332",
        lightOrange: "#FFAA88"
    },
    styles: {
        global: {
            body: {
                bg: "bg",
                color: "fg",
            },
            button: {
                color: "bg",
                fontSize: "3xl"
            },
            input: {
                outline: "0",
                border: "none",
                bg: "bg",
                appearence: "number-input"
            }
        }
    }
});
