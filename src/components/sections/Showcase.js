import React from "react"
import styled, { keyframes } from "styled-components";


const Section = styled.div`
min-height : 100vh;
width : 100vw;

background-color : ${props => props.theme.text};
position : relative;

display : flex;
flex-direction: column;

justify-content: center;
align-items : center;
`

const move = keyframes`
0%{ transform : translateX(100%) };
100%{ transform : translateX(-100%) };
`

const Row = styled.div`
background-color: lightblue;
white-space : nowrap;
box-sizing: content-box;

margin : 2rem 0;
display : flex;

animation : ${move} 20s linear infinite ${props => props.direction};

div {
    width : 5rem;
    height : 5rem;
    margin : 2rem;

    background-color : yellow;
}
`

const ProductItem = ({img , number , price}) => {
    return (
        <></>
    )
}

function Showcase(){
    return (
        <Section>
            <Row direction="none">
                <ProductItem></ProductItem>
                <div>Item</div>
                <div>Item</div>
            </Row>
            <Row direction="reverse">
                <div>Item</div>
                <div>Item</div>
                <div>Item</div>
            </Row>
        </Section>
    )
}

export default Showcase;