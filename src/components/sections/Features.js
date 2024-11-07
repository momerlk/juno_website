import React from "react"
import styled from "styled-components";
import DrawSVG from "../DrawSVG";

const Section = styled.section`
min-height : 100vh;
width : 100vw;

background-color: ${props => props.theme.body};
position : relative;
`

const Title = styled.h2`
font-size : ${props => props.theme.fontxxl};
text-transform: capitalize;

color : ${props => props.theme.text};

display : flex;
justify-content: center;
align-items : center;

margin : 1rem auto;
border-bottom : 2px solid ${props => props.theme.text};
width : fit-content;

`   

const SvgContainer = styled.div`
display : flex;
justify-content: center;
align-items: center;
`

const Container = styled.div`
width : 70%;
height : 200vh;

background-color: ${props => props.theme.body};
margin : 0 auto;

display : flex;
justify-content: center;
align-items: center;

position : relative;
`

const Features = () => {
    return (
        <Section>
            <Title>Features</Title>
            <Container>
                <SvgContainer>
                    <DrawSVG />
                </SvgContainer>
            </Container>
        </Section>
    )
}

export default Features;