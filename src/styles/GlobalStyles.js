import "@fontsource/akaya-telivigala"
import "@fontsource/sora"
import { createGlobalStyle } from "styled-components"

const GlobalStyles = createGlobalStyle`
*,*::before,*::after {
    margin : 0;
    padding : 0;
}

h1,h2,h3,h4,h5 : {
    margin : 0;
    padding : 0;
}

body {
    font-family : 'Sora', sans-serif;

}

a {
    color : inherit;
    text-decoration : none;
}


`

export default GlobalStyles