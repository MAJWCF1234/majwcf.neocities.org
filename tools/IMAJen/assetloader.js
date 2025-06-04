// assetLoader.js

window.GameAssets = {
    IMG_PREFIX: 'images/',
    MODEL_PATH_PREFIX: 'models/',

    // List of model names (without prefix)
    availableModels: [
        'crate1', 'crate2', 'crate3', 'elevator', 'blast_door',
        'office_chair', 'tape_drive', 'cryo_pod', 'wood_desk'
    ],

    // Pipe-separated string of "Gritty" texture filenames (without prefix)
    texturePathString: "BRICK_1A.png|BRICK_2B.png|BRICK_3B.png|BRICK_3D.png|BRICK_4A.png|BRICK_6D.png|Bigdoor_left.png|Bigdoor_right.png|BluePanel.png|CONCRETE_3C.png|CONCRETE_4A.png|CONSOLE_1B.png|Cryoback.png|Cryofront.png|Cryoleft.png|Cryoright.png|Cryotop.png|DIRT_1A.png|DOORTRIM_1A.png|DOOR_1A.png|DOOR_1C.png|DOOR_1E.png|DOOR_4A.png|Door.png|FLOOR_1A.png|FLOOR_3A.png|FLOOR_4A.png|GRASS_1A.png|GRID_1A.png|GRID_2B.png|HEDGE_1A.png|LAB_2B.png|LIGHT_1B.png|LockerPanel.png|Lorenote1.png|PAPER_1B.png|PAPER_1E.png|PAPER_1F.png|PIPES_1A.png|PIPES_2B.png|RIVET_1A.png|SAND_1A.png|WARN_1A.png|WOOD_1C.png|ammo.png|ammocrate.png|bigdoor23.png|blood.png|blood1.png|bullet.png|bullethole.png|bush1.png|bush2.png|bush3.png|bush4.png|bush5.png|ceiling_tiles_damaged.png|concrete_stained.png|concretewall.png|crate1.png|crate2.png|crate3.png|crate4.png|darkbricks.png|darktiles.png|desk_metal.png|dirt.png|door_barricaded.png|door_security_heavy.png|doorbord.png|elecPanel.png|elecbox.png|elevator_ceiling.png|elevator_door.png|elevator_floor.png|elevator_shaft.png|elevator_wall.png|floor_tiles_dirty.png|foresta1.png|foresta2.png|foresta3.png|foresta4.png|foresta5.png|foresta6.png|grass1.png|grass2.png|grass3.png|grass4.png|gun.gif|hazard.png|health_pack.png|iron.png|irondoor.png|ja987.png|jasdf7.png|jkdsa8j.png|key.png|keycardreader.png|level-2-keycard.png|level-3-keycard.png|level-4-keycard.png|level-5-keycard.png|level1keycard.png|lite1.png|lkhj58.png|locker.png|lockerSlim.png|medkit.png|n_gr_0_02.png|n_grass_diff_0_01.png|n_grass_diff_0_02.png|n_grass_diff_0_03.png|n_grass_diff_0_04.png|n_grass_diff_0_05.png|n_grass_diff_0_06.png|n_grass_diff_0_07.png|n_grass_diff_0_08.png|n_grass_diff_0_13.png|n_grass_diff_0_14.png|n_grass_diff_0_15.png|n_grass_diff_0_16.png|n_grass_diff_0_17.png|n_grass_diff_0_18.png|n_grass_diff_0_19.png|n_grass_diff_0_20.png|n_grass_diff_0_21.png|n_grass_diff_0_22.png|n_grass_diff_0_23.png|n_grass_diff_0_24.png|n_grass_diff_0_25.png|n_grass_diff_0_26.png|n_grass_diff_0_27.png|n_grass_diff_0_28.png|n_grass_diff_0_29.png|n_grass_diff_0_30.png|n_grass_diff_0_31.png|n_grass_diff_0_32.png|n_grass_diff_0_33.png|n_grass_diff_0_34.png|n_grass_diff_0_35.png|n_grass_diff_0_36.png|n_grass_diff_0_37.png|n_grass_diff_0_38.png|n_grass_diff_0_39.png|n_grass_diff_0_40.png|n_grass_diff_0_41.png|n_grass_diff_0_42.png|n_grass_diff_0_44.png|n_grass_diff_0_45.png|n_grass_diff_0_46.png|n_grass_diff_0_47.png|n_grass_diff_0_48.png|n_grass_diff_0_49.png|n_grass_diff_0_50.png|n_grass_diff_0_51.png|n_grass_diff_0_52.png|n_grass_diff_0_53.png|n_grass_diff_0_54.png|n_grass_diff_0_55.png|n_grass_diff_0_56.png|n_grass_diff_0_57.png|n_grass_diff_0_58.png|n_grass_diff_0_59.png|n_grass_diff_0_60.png|n_grass_diff_0_61.png|n_grass_diff_0_62.png|n_grass_diff_0_63.png|n_grass_diff_0_64.png|pistol_ammo.png|railing.png|ramp1.png|shortgrass1.png|shortgrass2.png|shortgrass3.png|sky.png|stepbot.png|steplight.png|stepsid.png|steptop.png|sun.png|suprt1.png|suprt2.png|suprt3.png|terminal_screen_off.png|tree.png|tree1.png|tree2.png|tree3.png|trim1.png|trim2.png|vdoor.png|wall_office_basic.png|wall_panel_damaged.png|water.png|xcrate11a.png|xcrate11b.png|office_chair_back_front.png|office_chair_back_rear.png|office_chair_seat_top.png|office_chair_seat_bottom.png|office_chair_stem.png|tapedrive_right.png|tapedrive_left.png|tapedrive_top.png|tapedrive_bottom.png|tapedrive_front.png|tapedrive_back.png|Cryoright.png|Cryoleft.png|Cryotop.png|Cryofront.png|Cryoback.png|wooddesktop.png|ICONCEIL.png|ICONLION.png|ICONLIOFF.png|ICONFLOOR.png|ICONWALL.png",

    // Pipe-separated string of "Toony" texture filenames (without prefix)
    toonTexturePathString: "toon_brick_red.png|toon_brick_grey.png|toon_brick_mossy.png|toon_cobblestone.png|toon_concrete_smooth.png|toon_concrete_cracked.png|toon_dirt_muddy.png|toon_dirt_grassy.png|toon_floor_wood_planks.png|toon_floor_tile_check.png|toon_floor_metal_plate.png|toon_grass_lush.png|toon_grass_patchy.png|toon_metal_rusty.png|toon_metal_clean.png|toon_rock_cliff.png|toon_sand_simple.png|toon_wall_plaster.png|toon_wood_log.png|toon_wood_painted.png",

    // Array of "Horror" texture filenames (without prefix)
    horrorTextureFilenames: [
        "horror_arrow1.png", "horror_arrow2.png", "horror_arrow3.png", "horror_arrow4.png",
        "horror_backshroom_texture.png", "horror_bricks_color.png", "horror_bricks_height.png",
        "horror_bricks_normal.png", "horror_canned_food.png", "horror_carpet_color.png",
        "horror_carpet_height.png", "horror_carpet_normal.png", "horror_caustics3.png",
        "horror_ceiling_tile_color.png", "horror_ceiling_tile_glitched_color.png",
        "horror_ceiling_tile_glitched_height.png", "horror_ceiling_tile_glitched_normal.png",
        "horror_ceiling_tile_height.png", "horror_ceiling_tile_normal.png",
        "horror_chain_fence_color.png", "horror_chain_fence_height.png", "horror_chain_fence_normal.png",
        "horror_clouds1.png", "horror_clouds2.png", "horror_concrete1.png", "horror_concrete10.png",
        "horror_concrete11.png", "horror_concrete12.png", "horror_concrete2.png", "horror_concrete5.png",
        "horror_concrete6.png", "horror_concrete7.png", "horror_concrete9.png", "horror_concrete_color.png",
        "horror_concrete_height.png", "horror_concrete_normal.png", "horror_contrast_noise.png",
        "horror_crate_color.png", "horror_crate_height.png", "horror_crate_normal.png",
        "horror_dirt_color.png", "horror_dirt_height.png", "horror_dirt_normal.png", "horror_dither.png",
        "horror_door_drawing.png", "horror_metal1.png", "horror_metal2.png", "horror_metal3.png",
        "horror_newstairs_texture.png", "horror_pool_tiles.png", "horror_puddle_noise.png",
        "horror_puddle_noise2.png", "horror_puddle_normal.png", "horror_rug1.png", "horror_rug2.png",
        "horror_rust2.png", "horror_rust3.png", "horror_rust4.png", "horror_skinwalker_eyes.png",
        "horror_small_pipe_set_connectors.png", "horror_smiler.png", "horror_smiler1.png",
        "horror_smiler2.png", "horror_stars.png", "horror_super_noise.png",
        "horror_thin_fluorescent_light_texture.png", "horror_utility_pole_color.png",
        "horror_vhs_noise.png", "horror_wall_block.png", "horror_wall_block_2.png",
        "horror_wall_block_2_texture.png", "horror_wall_small_1.png", "horror_wall_small_2.png",
        "horror_wallpaper_bottom_block_texture.png", "horror_water_noise.png",
        "horror_water_normal.png", "horror_window_drawing.png", "horror_pool_tiles_normal.png",
        "horror_pool_tiles_spec.png", "horror_pool_tiles_AO.png"
    ],

    // Array of skybox filenames (without prefix)
    // The main script will add IMG_PREFIX to these
    availableSkyboxFilenames: [
        'sky.png', 'sky1.png', 'sky2.png', 'sky3.png', 'sky4.png',
        'sky5.png', 'sky6.png', 'sky7.png', 'sky8.png', 'sky9.png',
        'sky10.png', 'sky11.png', 'sky12.png', 'sky13.png'
    ]
};

// You can also define other shared asset lists here if needed, for example:
// window.GameAssets.soundEffectFilenames = { ... };
// window.GameAssets.musicFilenames = { ... };