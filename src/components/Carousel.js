import React from "react";
import styled from "styled-components";
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import required modules
import { Pagination, Navigation, Autoplay, EffectCards } from "swiper";

// product images
import img1 from "../assets/products/1.webp"
import img2 from "../assets/products/2.webp"
import img3 from "../assets/products/3.webp"
import img4 from "../assets/products/4.webp"
import img5 from "../assets/products/5.jpeg"
import img6 from "../assets/products/6.webp"
import img7 from "../assets/products/7.jpeg"
import img8 from "../assets/products/8.jpeg"
import img9 from "../assets/products/9.jpeg"
import img10 from "../assets/products/10.jpeg"

import Arrow from "../assets/Arrow.svg"

const Container = styled.div`
width : 25vw;
height : 70vh;


.swiper {
    width : 49vh;
    height : 70.5vh;
}

.swiper-slide {
    border-radius : 20px;
}

img {
    width : 88%;
    height : 88%;
    object-fit: cover; /* Ensures the image fills the card */
    border-radius : 20px;
}

.product-card {
    width : 100%;
    height : 100%;
    background-color : ${props => props.theme.carouselColor};
    border-radius : 20px;

    justify-content: center;
    align-items: center;

    display : flex;
    flex-direction: column;
}

.swiper-button-next {
    color : white;
    right : 0;
    width : 4rem;

    background-image: url(${Arrow});
    background-position: center;
    background-size: cover;

    &:after {
        display : none;
    }
}

.swiper-button-prev {
    color : white;
    left : 0;
    width : 4rem;

    transform: rotate(180deg);

    background-image: url(${Arrow});
    background-position: center;
    background-size: cover;

    &:after {
        display : none;
    }
}


`

const Carousel = () => {
    return (
        <Container>
            <Swiper
                autoplay={{
                    delay : 2000,
                    disableOnInteraction : false,
                }}
                pagination={{
                    type : "fraction"
                }}
                navigation={true}
                scrollbar={{
                    draggable : true,
                }}
                effect={'cards'}
                grabCursor={true}
                modules={[EffectCards, Pagination, Navigation, Autoplay]}
                className="mySwiper"
            >
                <SwiperSlide> 
                    <div className="product-card">
                        <img src={img1} /> 
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img2} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img3} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img4} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img5} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img6} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img7} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img8} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide>
                    <div className="product-card">
                        <img src={img9} /> 
                    </div>         
                </SwiperSlide>
                <SwiperSlide> 
                    <div className="product-card">
                        <img src={img10} /> 
                    </div>         
                </SwiperSlide>
            
            </Swiper>
            
        </Container>
    )
}

export default Carousel;