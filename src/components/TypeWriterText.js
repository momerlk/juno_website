import React from "react";
import styled from "styled-components";
import Typewriter from 'typewriter-effect';


const Title = styled.h2`
font-size : ${props => props.theme.fontxxl};
text-transform: capitalize;
width : 80%;
color : ${props => props.theme.text};
align-self: flex-start;

span {
    text-transform: uppercase;
}
`


const SubTitle = styled.h3`
    font-size : ${props => props.theme.fontlg};
    font-weight: 600;
    
    margin-bottom: 1rem;
    width : 80%;
    align-self: flex-start;

    text-transform: capitalize; 
    color : ${props => `rgba(${props.theme.textRgba},0.6)`};
`

const TypeWriterText = () => {
    return (
        <Title>
            Discover a new era of fashion.<br></br>
            <Typewriter
                options={{
                    strings: ['100,000+ items', '50+ brands'],
                    autoStart: true,
                    loop: true,
                }}
            />
            <SubTitle>
                Bored of scrolling? Try something new.
            </SubTitle>
        </Title>
    )
}

export default TypeWriterText;