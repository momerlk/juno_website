import React from "react"
import styled from "styled-components"

import omer from "../../assets/team/omer.png"
import zayan from "../../assets/team/zayan.jpeg"
import img3 from "../../assets/products/3.webp"

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

const Container = styled.div`
width : 75%;
margin : 2rem auto;

display : flex;
justify-content: space-between;
align-items: center;

flex-wrap: wrap;
`

const Item = styled.div`
width : calc(20rem - 4vw);
padding : 1rem 0;
color : ${props => props.theme.body};
margin : 2rem 1rem;
position : relative;

border : 2px solid ${props => props.theme.text};
border-radius: 20px;

&:hover {
    img{
        transform: translateY(-2rem) scale(1.2);
    }
}
`

const ImgContainer = styled.div`
width : 14rem;
margin : 0 1rem;


border-radius : 20px;
cursor : pointer;

img {
    width : 100%;
    height : 80%;

    border-radius : 12px;
    transition : all 0.3s ease;

}
`

const Name = styled.h2`
font-size : ${props => props.theme.fontlg};
display : flex;

align-items : center;
justify-content: center;

text-transform: uppercase;
color : ${props => props.theme.text};

margin-top : 1rem;
` 

const Position = styled.h2`
font-size : ${props => props.theme.fontmd};
display : flex;

align-items : center;
justify-content: center;

text-transform: capitalize;
color : ${props => `rgba(${props.theme.textRgba},0.9)`};

margin-top : 1rem;

font-weight : 600;
` 

const MemberComponent = ({img, name="", EngPosition="" , UrduPosition=""}) => {
    return (
        <Item>
            <ImgContainer>
                <img src={img} alt={name}/> 
            </ImgContainer>
            <Name>{name}</Name>
            <Position>{EngPosition} | {UrduPosition}</Position>
        </Item>
    )
}

const Team = () => {
    return (
        <Section>
            <Title>Team</Title>
            <Container>
                <MemberComponent img={omer} name={"Omer Malik"} EngPosition={"CEO"} UrduPosition={"بادشاہ "}/>
                <MemberComponent img={zayan} name={"Amr Nazir"} EngPosition={"COO"} UrduPosition={"نائب"}/>
                <MemberComponent img={zayan} name={"Zayan Hussain"} EngPosition={"CCO"} UrduPosition={"دستیار "}/>
            </Container>
        </Section>
    )
}

export default Team;