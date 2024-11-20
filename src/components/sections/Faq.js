import React from "react";
import styled from "styled-components";

const Section = styled.section`
min-height : 100vh;
width : 100vw;

background-color: ${props => props.theme.text};
position : relative;

color : ${props => props.theme.body};

display : flex;
justify-content: center;
align-items :center;
flex-direction: column;
`

const Title = styled.h2`
font-size : ${props => props.theme.fontxxl};
text-transform: capitalize;

color : ${props => props.theme.body};


margin : 1rem auto;
/* border-bottom : 2px solid ${props => props.theme.carouselColor}; */
width : fit-content;

`  

const Container = styled.div`
width : 75%;
margin : 2rem auto;

display : flex;
justify-content: center;
align-content: center;
`

const Box = styled.div`
width : 45%;
`

const Faq = () => {
    return (
        <Section>
            <Title>Serving 50,000+ Customers.</Title>
            {/* <Container>
                <Box>
                    col 1
                </Box>
                <Box>
                    col 2
                </Box>
            </Container> */}
        </Section>
    )
}

export default Faq;