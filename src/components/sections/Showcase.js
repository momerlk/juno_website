import React, { useRef } from "react"
import styled, { keyframes } from "styled-components";

// product images
import img1 from "../../assets/products/1.webp"
import img2 from "../../assets/products/2.webp"
import img3 from "../../assets/products/3.webp"
import img4 from "../../assets/products/4.webp"
import img5 from "../../assets/products/5.jpeg"
import img6 from "../../assets/products/6.webp"
import img7 from "../../assets/products/7.jpeg"
import img8 from "../../assets/products/8.jpeg"
import img9 from "../../assets/products/9.jpeg"
import img10 from "../../assets/products/10.jpeg"

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
white-space : nowrap;
box-sizing: content-box;

margin : 2rem 0;
display : flex;

animation : ${move} 20s linear infinite ${props => props.direction};

`

const ImgContainer = styled.div`
width : 14rem;
margin : 0 1rem;


border-radius : 20px;
cursor : pointer;

img {
    width : 100%;
    height : 315px;

    border-top-right-radius: 13px;
    border-top-left-radius: 13px;
}
`

const Details = styled.div`
display : flex;
justify-content : space-between;

padding : 0.3rem 1rem;
background-color: ${props => props.theme.text};

border : 2px solid ${props => `rgba(${props.theme.bodyRgba} , 0.5)`};

border-bottom-left-radius : 20px;
border-bottom-right-radius : 20px;

span {
    font-size : ${props => props.theme.fontsm};
    color : ${props => `rgba(${props.theme.bodyRgba},0.5)`};
    font-weight : 600;
    line-height : 1.5rem;
}

h1 {
    font-size : ${props => props.theme.fontmd};
    color : ${props => props.theme.body};
    font-weight : 600;

}
`

const ProductItem = ({img , number=0 , price=999, passRef}) => {

    let play = (e) => {
        passRef.current.style.animationPlayState = 'running';
    }
    let pause = (e) => {
        passRef.current.style.animationPlayState = 'paused';
    }

    return (
        <ImgContainer onMouseOver={e => pause(e)} onMouseOut={e => play(e)}>
            <img src={img} alt="The Junos"/> 
            <Details>
                <div>
                    <span>Juno</span><br />
                    <h1>#{number}</h1>
                </div>
                <div>
                    <span>Price</span>
                    <h1>Rs. {Number(price)}</h1>
                </div>
            </Details>
        </ImgContainer>
    )
}

function Showcase(){
    const Row1Ref = useRef(null);
    const Row2Ref = useRef(null);
    return (
        <Section>
            <Row direction="none" ref={Row1Ref}>
                <ProductItem img={img1} number={1} price={3596} passRef={Row1Ref}/>
                <ProductItem img={img2} number={2} price={2240} passRef={Row1Ref}/>
                <ProductItem img={img3} number={3} price={1521} passRef={Row1Ref}/>
                <ProductItem img={img4} number={4} price={2800} passRef={Row1Ref}/>
                <ProductItem img={img5} number={5} price={3100} passRef={Row1Ref}/>
            </Row>
            <Row direction="reverse" ref={Row2Ref}>
                <ProductItem img={img6} number={6} price={4523} passRef={Row2Ref}/>
                <ProductItem img={img7} number={7} price={5120} passRef={Row2Ref}/>
                <ProductItem img={img8} number={8} price={2910} passRef={Row2Ref}/>
                <ProductItem img={img9} number={9} price={990} passRef={Row2Ref}/>
                <ProductItem img={img10} number={10} price={1596} passRef={Row2Ref}/>
            </Row>
        </Section>
    )
}

export default Showcase;