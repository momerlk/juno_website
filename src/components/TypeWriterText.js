import React from "react";
import styled from "styled-components";
import Typewriter from 'typewriter-effect';
import Button from "./Button";


const Title = styled.h2`
font-size : ${props => props.theme.fontxxl};
text-transform: capitalize;
font-weight: 700;

color : ${props => props.theme.text};
align-self: flex-start;
margin-left : 0;
span {
    text-transform: uppercase;
    font-size : ${props => props.theme.fontxs};
}
`


const SubTitle = styled.h3`
    font-size : ${props => props.theme.fontlg};
    font-weight: 600;
    
    margin-top : 5px;
    margin-bottom: 1rem;
    width : 80%;
    align-self: flex-start;

    text-transform: capitalize; 
    color : ${props => `rgba(${props.theme.textRgba},0.4)`};
`

const TypeWriterText = () => {
    return (
        <>
        <Title>
            Discover a new era of fashion.
            <Typewriter
                options={{
                    strings: ['<span>100,000+ items</span>', '<span>50+ brands</span>'],
                    autoStart: true,
                    loop: true,
                    
                }}
            />
            
        </Title>
        <SubTitle>
            Start Swiping.
        </SubTitle>
        <div style={{
            display : "flex",
            flexDirection : "column",
            width : "50%",
        }}>
        <Button text="Apple" link={"https://testflight.apple.com/join/Pzt9wnBm"}/>
        <br></br>
        <Button text="Android" link={"https://expo.dev/artifacts/eas/pfiEgDcp4oyEqp9cUsSrPk.apk"}/>
        </div>
        </>
    )
}

export default TypeWriterText;