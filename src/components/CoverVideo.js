import React from "react";
import styled from "styled-components";
import GIF from "../assets/juno_demo_video.mp4"
import Image from "../assets/juno_logo_mockup.png"

const VideoContainer = styled.div`
width : 100%;

video {
    width : 60%;
    height : 90%;
    margin-left: 30%;
}
`

const CoverVideo = () => {
    return (
        <VideoContainer>
            <video src={GIF} type="video/mp4" autoPlay muted loop />
        </VideoContainer>
    )
}

export default CoverVideo;