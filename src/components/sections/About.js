import React from "react";
import styled, { ThemeProvider } from "styled-components";
import Carousel from "../Carousel";
import Button from "../Button";
import { dark } from "../../styles/Themes";

const Section = styled.section`
min-height : 100vh;
width : 100%;

background-color: ${props => props.theme.text};
display : flex;

justify-content: center;
align-items: center;

position : relative;
`

const Container = styled.div`
width : 75%;
margin : 0 auto;

display : flex;
justify-content: center;
align-items: center;
`

const Box = styled.div`
width : 50%;
height : 100%;

display : flex;
flex-direction: column;

justify-content: center;
align-items: center;
`

const Title = styled.h2`
    width: 100%;
    font-size : ${props => props.theme.fontxxl};
    text-transform: capitalize;
    color : ${props => props.theme.body};
    align-self: flex-start;
    width : 80%;
    margin : 0 auto;
`

const SubText = styled.p`
    font-size : ${props => props.theme.fontlg};
    color : ${props => props.theme.body};
    align-self: flex-start;
    width : 80%;
    margin : 1rem auto;
    font-weight: 400;
`

const SubTextLight = styled.p`
    font-size : ${props => props.theme.fontmd};
    color : ${props => `rgba(${props.theme.bodyRgba} , 0.6)`};
    align-self: flex-start;
    width : 80%;
    margin : 1rem auto;
    font-weight: 400;
`

const ButtonContainer = styled.div`
    width : 80%;
    margin : 1rem auto;
    align-self : flex-start;

`

const About = () => {
    return(
        <Section>
            <Container>
                <Box>
                    <Carousel />
                </Box>
                <Box>
                    <Title>
                        Welcome to Juno.
                    </Title>
                    <SubText>
                    Juno fosters a community where users can interact, share their collections, discuss fashion choices, and even shop together. 
                    </SubText>
                    <SubTextLight>
                    The app uses a powerful recommendation system that personalizes product feeds based on user interactions, such as swiping right or left to like or dislike items and swiping up to add items to the cart.
                    </SubTextLight>
                    <ThemeProvider theme={dark}>
                        <ButtonContainer>
                            <Button text="Download Now" link="/"/>
                        </ButtonContainer>
                        
                    </ThemeProvider>
                    
                </Box>
            </Container>
        </Section>
    )
}

export default About;