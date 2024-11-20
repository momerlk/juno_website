import React from "react";
import styled from "styled-components";
import bannerImg from "../assets/juno_banner.webp"

const Section = styled.section`
width : 100vw;
height : 25rem;
position : relative;

border-top : 2px solid ${props => props.theme.text};
border-top : 2px solid ${props => props.theme.text};

background-color: ${props => `rgba(${props.theme.textRgba},0.9)`};

display : flex;
justify-content : center;
align-items : center;

overflow : hidden;
`

const Title = styled.h1`
font-size : ${props => props.theme.fontxxxl};
color : ${props => props.theme.body};

padding : 1rem 2rem;
z-index : 10;
width : 25%;
`

const ImgContainer = styled.div`
width : 100%;
position : absolute;
opacity : 0.15;
top : 0%;
left : 0%;
`

const BtnContainer = styled.div`
width : 35%;
display : flex;
justify-content: flex-end;

`

const JoinNow = styled.button`
display : inline-block;
background-color : ${props => props.theme.body};
color : ${props => props.theme.text};
outline : none;
border: none;

font-size: ${props => props.theme.fontsm};
padding : 0.8rem 2.5rem;
border-radius: 50px;

cursor : pointer;

position : relative;
transition: all 0.2s ease;
&:hover {
    transform : scale(0.9);
}

&::after {
    content : ' ';
    position : absolute;
    top : 50%;
    left : 50%;
    
    transform : translate(-50%, -50%) scale(0);

    border : 2px solid ${props => props.theme.text};
    width : 100%;
    height : 100%;
    
    border-radius : 50px;
    transition : all 0.2s ease;

}

&:hover::after {
    transform : translate(-50%, -50%) scale(1);
    padding : 0.3rem;
}
`



const Banner = () => {
    return (
        <Section>
            <ImgContainer>
                <img src={bannerImg} alt={"banner"}/>
            </ImgContainer>
            <Title>Become a seller.</Title>
            <BtnContainer>
                <JoinNow>
                    Join Now
                </JoinNow>
            </BtnContainer>

        </Section>
    )
}

export default Banner;