import React, { useLayoutEffect, useRef} from "react"
import styled from "styled-components";
import DrawSVG from "../DrawSVG";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

const Items = styled.ul`
list-style : none;

width : 100%;
height : 100%;

display : flex;
flex-direction : column;

justify-content: center;
align-items : center;

&>*:nth-of-type(2n+1){
    justify-content: start;

    div {
        border-radius : 50px 0 50px 0;
        text-align: right;
    }
    p {
        border-radius : 40px 0 40px 0;
    }
}
&>*:nth-of-type(2n){
    justify-content: end;
    div {
        border-radius : 0 50px 0 50px;
        text-align: left;
    }
    p {
        border-radius : 0 40px 0 40px;
    }
}
`

const Item = styled.li`
width : 100%;
height: 100%;

display : flex;

`
const ItemContainer = styled.div`
width : 40%;
height : fit-content;

padding : 1rem;
border : 3px solid ${props => props.theme.text};

`

const Box = styled.p`
height : fit-content;
background-color : ${props => props.theme.carouselColor};
color : ${props => props.theme.text};

padding : 1rem;
position : relative;
border : 1px solid ${props => props.theme.text};
`;

const SubTitle = styled.span`
display : block;
font-size : ${props => props.theme.fontxl};
text-transform: capitalize;
color : ${props => props.theme.text};
`;

const Text = styled.span`
display : block;
font-size : ${props => props.theme.fontsm};
color : ${props => props.theme.text};

font-weight : 400;
margin : 0.5rem 0;
`;

const FeatureItem = ({title , subtext , addToRef}) => {
    return (
        <Item ref={addToRef}>
            <ItemContainer>
                <Box>
                    <SubTitle>
                        {title}
                    </SubTitle>
                    <Text>
                        {subtext}
                    </Text>
                </Box>
            </ItemContainer>
        </Item>
    )
}

const Features = () => {
    const revealRefs = useRef([]);
    revealRefs.current = [];

    gsap.registerPlugin(ScrollTrigger);

    const addToRefs = (el) => {
        if(el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    }

    useLayoutEffect(() => {
        let t2 = gsap.timeline();
        revealRefs.current.forEach( (el, index) => {
            t2.fromTo(
                el.childNodes[0],
                {
                    y : '0',
                }, {
                    y : "-30%",

                    scrollTrigger : {
                        id : `section-${index+1}`,
                        trigger : el,
                        start : 'top center+=200px',
                        end : "bottom center",
                        scrub : true,
                    }
                }
            )
        })
       return () => {} 
    }, [])

    return (
        <Section>
            <Title>Features</Title>
            <Container>
                <SvgContainer>
                    <DrawSVG />
                </SvgContainer>
                <Items>
                    <Item></Item>
                    <FeatureItem addToRef={addToRefs} title="For You Page" subtext="Discover new, fresh brands, exciting new products and updates on new collections."/>
                    <FeatureItem addToRef={addToRefs} title="Community" subtext="Create and show off your closet with your favourite clothes. Gift pieces, and share them with others. Discuss clothes with friends. "/>
                    <FeatureItem addToRef={addToRefs} title="Recommendation system" subtext="Powerful recommendation AI for a personalized feed "/>
                    <FeatureItem addToRef={addToRefs} title="Convenience" subtext="Swipe right and left to like or dislike, Swipe up to add to cart, all on the same app"/>
                </Items>
            </Container>
        </Section>
    )
}

export default Features;