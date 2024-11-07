import React from "react"
import styled from "styled-components";

const Section = styled.section`
min-height : 100vh;
width : 100vw;

background-color: ${props => props.theme.body};
position : relative;
`

const Title = styled.h2`
font-size : ${props => props.theme.fontxxl};
text-transform: capitalize;
font-weight: 700;

color : ${props => props.theme.text};
align-self: flex-start;
margin-left : 0;
`


const Features = () => {
    return (
        <Section>
            <Title>Features</Title>
            
        </Section>
    )
}

export default Features;