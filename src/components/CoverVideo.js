import React from "react";
import styled from "styled-components";
import GIF from "../assets/juno_demo_video.mp4"

const VideoContainer = styled.div`
width : 100%;

video {
    width : 55%;
    height : 75%;
    margin-top : 5%;
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