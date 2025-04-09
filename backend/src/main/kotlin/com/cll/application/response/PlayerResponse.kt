package com.cll.application.response

data class PlayerResponse(
    val id: String,
    val username: String,
    val points: Int,
    val ranking: Int,
    val avatar: String? = null
)
